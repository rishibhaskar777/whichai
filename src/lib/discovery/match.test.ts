import { describe, expect, it } from "vitest";
import { buildIndex, findDuplicate, findRejected, findSimilar } from "./match";

const providers = [
  { id: "anysphere", name: "Anysphere" },
  { id: "ollama", name: "Ollama" },
  { id: "github", name: "GitHub" },
  { id: "lm-studio", name: "LM Studio" },
];

const tools = [
  {
    id: "cursor",
    name: "Cursor",
    providerId: "anysphere",
    officialUrl: "https://cursor.com",
    officialDomains: ["cursor.com"],
  },
  {
    id: "ollama",
    name: "Ollama",
    providerId: "ollama",
    officialUrl: "https://ollama.com",
    officialDomains: ["ollama.com", "github.com/ollama"],
    getIt: {
      linux: { url: "https://github.com/ollama/ollama", linkCheckedOn: null },
      cliInstall: "curl -fsSL https://ollama.com/install.sh | sh",
    },
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    providerId: "github",
    officialUrl: "https://github.com/features/copilot",
    officialDomains: ["github.com/features"],
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    providerId: "lm-studio",
    officialUrl: "https://lmstudio.ai",
    officialDomains: ["lmstudio.ai"],
  },
];

const index = buildIndex(tools, providers);
const subject = (
  name: string,
  homepage: string | null = null,
  repository: string | null = null,
  maintainer: string | null = null,
) => ({ name, homepage, repository, maintainer });

describe("findDuplicate", () => {
  it("matches an exact name, ignoring case and punctuation", () => {
    expect(findDuplicate(subject("CURSOR"), index)).toEqual({
      toolId: "cursor",
      reason: "name",
    });
    expect(findDuplicate(subject("LM-Studio"), index)?.toolId).toBe(
      "lm-studio",
    );
  });

  it("matches an alias made from the provider's name", () => {
    expect(findDuplicate(subject("Copilot"), index)).toEqual({
      toolId: "github-copilot",
      reason: "alias",
    });
  });

  it("matches the tool's id as an alias", () => {
    expect(findDuplicate(subject("github copilot"), index)?.toolId).toBe(
      "github-copilot",
    );
  });

  it("matches a typo and a plural", () => {
    expect(findDuplicate(subject("Cursur"), index)).toEqual({
      toolId: "cursor",
      reason: "typo",
    });
    expect(findDuplicate(subject("Ollamas"), index)?.toolId).toBe("ollama");
  });

  it("does not match a different short name", () => {
    expect(findDuplicate(subject("Cube"), index)).toBeNull();
    expect(findDuplicate(subject("Cursorly Pro Max"), index)).toBeNull();
  });

  it("matches a domain and its subdomains", () => {
    expect(
      findDuplicate(subject("Brand New", "https://docs.cursor.com/x"), index),
    ).toEqual({ toolId: "cursor", reason: "domain" });
    expect(
      findDuplicate(subject("Brand New", "https://www.ollama.com/"), index)
        ?.reason,
    ).toBe("domain");
  });

  it("matches a repository address, with or without .git", () => {
    expect(
      findDuplicate(
        subject("Zzz", null, "https://github.com/Ollama/ollama.git"),
        index,
      ),
    ).toEqual({ toolId: "ollama", reason: "repository" });
  });

  it("does not treat another repository of a listed owner as a match", () => {
    expect(
      findDuplicate(
        subject("Whisperer", null, "https://github.com/ollama/whisperer"),
        index,
      ),
    ).toBeNull();
  });

  it("does not match through a shared host", () => {
    expect(
      findDuplicate(
        subject("Other", "https://github.com/someone/other"),
        index,
      ),
    ).toBeNull();
  });

  describe("a name that starts with a listed tool's name", () => {
    it("is that tool when it is on the tool's own owner path", () => {
      expect(
        findDuplicate(
          subject(
            "Ollama Desktop",
            null,
            "https://github.com/ollama/ollama-desktop",
          ),
          index,
        ),
      ).toEqual({ toolId: "ollama", reason: "extends" });
    });

    it("is that tool when it is made by the same provider", () => {
      expect(
        findDuplicate(subject("Ollama Desktop", null, null, "Ollama"), index),
      ).toEqual({ toolId: "ollama", reason: "extends" });
      expect(
        findDuplicate(
          subject("Cursor Agents", null, null, "Anysphere engineering blog"),
          index,
        )?.toolId,
      ).toBe("cursor");
    });

    it("is a new candidate when the maker and domain are someone else's", () => {
      expect(
        findDuplicate(
          subject(
            "Ollama Desktop",
            "https://ollama-desktop.example.dev/",
            "https://github.com/stranger/ollama-desktop",
            "stranger",
          ),
          index,
        ),
      ).toBeNull();
    });

    it("is a new candidate when nothing is known about its maker", () => {
      expect(findDuplicate(subject("Ollama Desktop"), index)).toBeNull();
    });

    it("lists the listed tool as similar when it is not the same tool", () => {
      const namesake = subject(
        "Ollama Desktop",
        "https://ollama-desktop.example.dev/",
        null,
        "stranger",
      );
      expect(findSimilar(namesake, index)).toEqual([
        { id: "ollama", name: "Ollama" },
      ]);
      expect(findSimilar(subject("Notefox"), index)).toEqual([]);
    });
  });

  it("returns null for something new", () => {
    expect(
      findDuplicate(subject("Notefox", "https://notefox.app/"), index),
    ).toBeNull();
  });
});

describe("findRejected", () => {
  const rejected = {
    names: ["Slop Machine"],
    domains: ["scam.example", "github.com/badowner"],
  };

  it("matches a name, a typo of it and nothing else", () => {
    expect(findRejected(subject("slop machine"), rejected)).not.toBeNull();
    expect(findRejected(subject("Slop Machin"), rejected)).not.toBeNull();
    expect(findRejected(subject("Slop Mop"), rejected)).toBeNull();
  });

  it("matches a domain and its subdomains", () => {
    expect(
      findRejected(subject("X", "https://app.scam.example/"), rejected),
    ).not.toBeNull();
    expect(
      findRejected(subject("X", "https://scam.example.org/"), rejected),
    ).toBeNull();
  });

  it("limits a shared host to the listed owner", () => {
    expect(
      findRejected(
        subject("X", null, "https://github.com/badowner/thing"),
        rejected,
      ),
    ).not.toBeNull();
    expect(
      findRejected(
        subject("X", null, "https://github.com/goodowner/thing"),
        rejected,
      ),
    ).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(
      findRejected(subject("Anything"), { names: [], domains: [] }),
    ).toBeNull();
  });
});
