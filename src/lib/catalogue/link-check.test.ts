import { describe, expect, it } from "vitest";
import {
  classify,
  stampLink,
  titleNamesSubject,
  type Fetched,
} from "./link-check";

const subject = {
  officialDomains: ["ollama.com", "github.com/ollama"],
  names: ["Ollama", "Ollama Inc"],
};

function fetched(patch: Partial<Fetched>): Fetched {
  return {
    status: 200,
    finalUrl: "https://ollama.com/download",
    title: null,
    error: null,
    ...patch,
  };
}

describe("classify", () => {
  const stored = "https://ollama.com/download";

  it("passes a page on an official domain at the stored address", () => {
    expect(classify(stored, fetched({}), subject)).toBe("ok");
  });

  it("notes a move that stays on an official domain", () => {
    expect(
      classify(
        stored,
        fetched({ finalUrl: "https://ollama.com/download/windows" }),
        subject,
      ),
    ).toBe("redirected");
  });

  it("ignores a trailing slash and www", () => {
    expect(
      classify(
        "https://www.ollama.com/download",
        fetched({ finalUrl: "https://ollama.com/download/" }),
        subject,
      ),
    ).toBe("ok");
  });

  it("flags a redirect to another domain", () => {
    expect(
      classify(
        stored,
        fetched({ finalUrl: "https://download-now.example/ollama" }),
        subject,
      ),
    ).toBe("left-domain");
  });

  it("flags error statuses and failed requests as broken", () => {
    expect(classify(stored, fetched({ status: 404 }), subject)).toBe("broken");
    expect(classify(stored, fetched({ status: 500 }), subject)).toBe("broken");
    expect(
      classify(
        stored,
        fetched({ status: null, finalUrl: null, error: "ENOTFOUND" }),
        subject,
      ),
    ).toBe("broken");
  });

  it("does not call a refusal or a timeout broken", () => {
    expect(classify(stored, fetched({ status: 403 }), subject)).toBe("blocked");
    expect(
      classify(stored, fetched({ title: "Just a moment..." }), subject),
    ).toBe("blocked");
    expect(
      classify(
        stored,
        fetched({
          status: null,
          finalUrl: null,
          error: "UND_ERR_CONNECT_TIMEOUT",
        }),
        subject,
      ),
    ).toBe("unreachable");
  });

  it("checks that a store page names the tool", () => {
    const store = "https://apps.apple.com/app/id123";
    const other = {
      status: 200,
      finalUrl: "https://apps.apple.com/us/app/other/id123",
      error: null,
    };
    expect(
      classify(
        store,
        { ...other, title: "Some Other App on the App Store" },
        subject,
      ),
    ).toBe("name-mismatch");
    expect(
      classify(store, { ...other, title: "Ollama on the App Store" }, subject),
    ).toBe("redirected");
  });
});

describe("titleNamesSubject", () => {
  it("matches names ignoring case and punctuation", () => {
    expect(titleNamesSubject("OTTER.ai - Transcribe", ["Otter.ai"])).toBe(true);
    expect(titleNamesSubject("Claude by Anthropic", ["Claude"])).toBe(true);
  });

  it("matches a very short name only as a whole word", () => {
    expect(titleNamesSubject("VN: Photo & Video Editor", ["VN"])).toBe(true);
    expect(titleNamesSubject("Environment settings", ["VN"])).toBe(false);
  });

  it("does not match unrelated titles", () => {
    expect(titleNamesSubject("Fast Photo Editor", ["Ollama"])).toBe(false);
  });
});

describe("stampLink", () => {
  const file = [
    "{",
    '  "web": {',
    '    "url": "https://ollama.com",',
    '    "linkCheckedOn": null',
    "  },",
    '  "windows": {',
    '    "url": "https://ollama.com/download",',
    '    "linkCheckedOn": "2026-01-02"',
    "  }",
    "}",
  ].join("\n");

  it("sets the date for one address only", () => {
    const result = stampLink(file, "https://ollama.com", "2026-10-10");
    expect(result.changed).toBe(true);
    expect(result.text).toContain('"linkCheckedOn": "2026-10-10"');
    expect(result.text).toContain('"linkCheckedOn": "2026-01-02"');
  });

  it("replaces an older date", () => {
    const result = stampLink(file, "https://ollama.com/download", "2026-10-10");
    expect(result.text).not.toContain("2026-01-02");
  });

  it("changes nothing for an address that is not in the file", () => {
    const result = stampLink(file, "https://example.com", "2026-10-10");
    expect(result.changed).toBe(false);
    expect(result.text).toBe(file);
  });
});
