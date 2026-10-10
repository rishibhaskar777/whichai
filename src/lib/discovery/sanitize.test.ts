import { describe, expect, it } from "vitest";
import {
  cleanHandle,
  cleanText,
  codeSpan,
  linkOrNone,
  safeHttpsUrl,
  titleSafeName,
} from "./sanitize";

describe("cleanText", () => {
  it("removes control, invisible and bidi characters", () => {
    const text = "Fo\u0000o​ ‮Bar⁦\r\nBaz\t";
    expect(cleanText(text, 60)).toBe("Fo o Bar Baz");
  });

  it("removes angle brackets so no comment or tag can be written", () => {
    const text = "<!-- whichai-candidate {} --> <script>x</script>";
    const clean = cleanText(text, 200);
    expect(clean).not.toMatch(/[<>]/);
  });

  it("turns backticks into quotes so text cannot leave a code span", () => {
    expect(cleanText("a ``` b ` c", 60)).toBe("a ''' b ' c");
  });

  it("limits length and ends with an ellipsis", () => {
    const clean = cleanText("word ".repeat(10_000), 40);
    expect(clean.length).toBeLessThanOrEqual(40);
    expect(clean.endsWith("…")).toBe(true);
  });

  it("returns an empty string for anything that is not text", () => {
    expect(cleanText(42, 10)).toBe("");
    expect(cleanText(null, 10)).toBe("");
  });

  it("normalises look-alike forms", () => {
    expect(cleanText("ＡＩ tool", 20)).toBe("AI tool");
  });
});

describe("titleSafeName", () => {
  it("keeps letters, digits and a few marks only", () => {
    expect(titleSafeName("@octocat #1 [x](y) Foo.js")).toBe(
      "octocat 1 xy Foo.js",
    );
  });

  it("is empty when nothing safe is left", () => {
    expect(titleSafeName("@#[]()")).toBe("");
  });
});

describe("codeSpan", () => {
  it("never contains a backtick inside", () => {
    const span = codeSpan("a`b``c");
    expect(span).toBe("`a'b''c`");
  });

  it("marks an empty value", () => {
    expect(codeSpan("   ")).toBe("`(none)`");
  });
});

describe("cleanHandle", () => {
  it("accepts a login and rejects anything else", () => {
    expect(cleanHandle("octo-cat_1")).toBe("octo-cat_1");
    expect(cleanHandle("@octocat")).toBeNull();
    expect(cleanHandle("a b")).toBeNull();
    expect(cleanHandle("x".repeat(60))).toBeNull();
  });
});

describe("safeHttpsUrl", () => {
  it("accepts a plain https address and drops the fragment", () => {
    expect(safeHttpsUrl("https://example.com/a?b=1#frag")).toBe(
      "https://example.com/a?b=1",
    );
  });

  it.each([
    "http://example.com",
    "javascript:alert(1)",
    "data:text/html,hi",
    "ftp://example.com",
    "https://user:pass@example.com",
    "https://example.com:8443",
    "https://127.0.0.1/",
    "https://[::1]/",
    "https://localhost/",
    "https://printer.local/",
    "https://intranet/",
    "not a url",
    "https://example.com/‮evil",
  ])("rejects %s", (value) => {
    expect(safeHttpsUrl(value)).toBeNull();
  });

  it("rejects a very long address", () => {
    expect(safeHttpsUrl(`https://example.com/${"a".repeat(400)}`)).toBeNull();
  });

  it("encodes characters that could end a link", () => {
    const url = safeHttpsUrl("https://example.com/a?q=(x)`y`<z>");
    expect(url).not.toBeNull();
    expect(url).not.toMatch(/[()`<>]/);
  });

  it("rejects non-strings", () => {
    expect(safeHttpsUrl(undefined)).toBeNull();
    expect(safeHttpsUrl(5)).toBeNull();
  });
});

describe("linkOrNone", () => {
  it("writes an autolink for a safe address and none otherwise", () => {
    expect(linkOrNone("https://example.com/")).toBe("<https://example.com/>");
    expect(linkOrNone("http://example.com")).toBe("none");
    expect(linkOrNone(null)).toBe("none");
  });
});
