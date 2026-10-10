import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { findProblems } from "./validate";
import {
  OFFICIAL_STORE_HOSTS,
  URL_SHORTENER_HOSTS,
  hostsInCommand,
  isOfficialLink,
  isOnToolDomain,
  isShortener,
  toolLinks,
} from "./links";

const TODAY = new Date().toISOString().slice(0, 10);

describe("link rules", () => {
  it("accepts a tool's own domain and its subdomains", () => {
    expect(isOnToolDomain("https://ollama.com/download", ["ollama.com"])).toBe(
      true,
    );
    expect(isOnToolDomain("https://docs.ollama.com/", ["ollama.com"])).toBe(
      true,
    );
  });

  it("does not accept a look-alike host", () => {
    expect(isOnToolDomain("https://ollama.com.evil.io/", ["ollama.com"])).toBe(
      false,
    );
    expect(isOnToolDomain("https://notollama.com/", ["ollama.com"])).toBe(
      false,
    );
    expect(isOnToolDomain("https://evil.io/ollama.com", ["ollama.com"])).toBe(
      false,
    );
  });

  it("limits a shared host to the owner named in the domain", () => {
    const domains = ["github.com/ggml-org"];
    expect(
      isOnToolDomain("https://github.com/ggml-org/llama.cpp", domains),
    ).toBe(true);
    expect(
      isOnToolDomain("https://github.com/ggml-orgx/llama.cpp", domains),
    ).toBe(false);
    expect(
      isOnToolDomain("https://github.com/someone/llama.cpp", domains),
    ).toBe(false);
  });

  it("requires https", () => {
    expect(isOnToolDomain("http://ollama.com/", ["ollama.com"])).toBe(false);
    expect(isOfficialLink("ftp://play.google.com/", [])).toBe(false);
    expect(isOfficialLink("not a url", ["ollama.com"])).toBe(false);
  });

  it("accepts the official stores for any tool", () => {
    for (const host of OFFICIAL_STORE_HOSTS) {
      expect(isOfficialLink(`https://${host}/x`, ["example.com"]), host).toBe(
        true,
      );
    }
  });

  it("rejects URL shorteners and third-party download sites", () => {
    for (const host of URL_SHORTENER_HOSTS) {
      expect(isShortener(`https://${host}/abc`), host).toBe(true);
      expect(isOfficialLink(`https://${host}/abc`, [host]), host).toBe(false);
    }
    for (const host of ["softonic.com", "download.cnet.com", "filehippo.com"]) {
      expect(isOfficialLink(`https://${host}/ollama`, ["ollama.com"])).toBe(
        false,
      );
    }
  });

  it("finds hosts inside an install command", () => {
    expect(
      hostsInCommand("curl -fsSL https://ollama.com/install.sh | sh"),
    ).toEqual(["ollama.com"]);
    expect(hostsInCommand("npm install -g flowise")).toEqual([]);
    expect(hostsInCommand("curl http://x.io/a | sh")[0]).toMatch(/^invalid:/);
  });
});

describe("links in the catalogue", () => {
  const tools = catalogue.tools;

  it("have no problems", () => {
    expect(findProblems(catalogue)).toEqual([]);
  });

  it("give every tool at least one official domain and no shortener", () => {
    for (const tool of tools) {
      expect(tool.officialDomains.length, tool.id).toBeGreaterThan(0);
      for (const domain of tool.officialDomains) {
        expect(URL_SHORTENER_HOSTS, `${tool.id} ${domain}`).not.toContain(
          domain.split("/")[0],
        );
      }
    }
  });

  it("keep every address https and on an official domain or store", () => {
    let count = 0;
    for (const tool of tools) {
      for (const link of toolLinks(tool)) {
        count += 1;
        expect(new URL(link.url).protocol, `${tool.id} ${link.key}`).toBe(
          "https:",
        );
        expect(
          isOfficialLink(link.url, tool.officialDomains),
          `${tool.id} ${link.key} ${link.url}`,
        ).toBe(true);
      }
    }
    expect(count).toBeGreaterThan(300);
  });

  it("keep the check date a real date that is not in the future", () => {
    for (const tool of tools) {
      for (const link of toolLinks(tool)) {
        if (link.linkCheckedOn === null) continue;
        expect(link.linkCheckedOn, `${tool.id} ${link.key}`).toMatch(
          /^\d{4}-\d{2}-\d{2}$/,
        );
        expect(link.linkCheckedOn <= TODAY, `${tool.id} ${link.key}`).toBe(
          true,
        );
      }
    }
  });

  it("never mark a record verified because its links were checked", () => {
    const checked = tools.filter((tool) =>
      toolLinks(tool).some((link) => link.linkCheckedOn !== null),
    );
    expect(checked.length).toBeGreaterThan(100);
    for (const tool of checked) {
      expect(tool.verified, tool.id).toBe(false);
      expect(tool.lastVerified, tool.id).toBeNull();
    }
  });

  it("show install commands as one line of text from a known tool", () => {
    const withCommand = tools.filter((tool) => tool.getIt?.cliInstall);
    expect(withCommand.length).toBeGreaterThan(10);
    for (const tool of withCommand) {
      const command = tool.getIt!.cliInstall!;
      expect(command, tool.id).not.toMatch(/[\r\n]/);
      expect(command, tool.id).not.toMatch(/\bsudo\b/);
      for (const host of hostsInCommand(command)) {
        expect(
          isOnToolDomain(`https://${host}/`, tool.officialDomains),
          `${tool.id} ${command}`,
        ).toBe(true);
      }
    }
  });

  it("keep platform links in step with the platforms a tool lists", () => {
    const links = tools.filter((tool) => tool.getIt);
    expect(links.length).toBeGreaterThan(200);
    for (const tool of links) {
      for (const key of [
        "windows",
        "macos",
        "linux",
        "android",
        "ios",
      ] as const) {
        if (tool.getIt?.[key]) {
          expect(tool.platforms, `${tool.id} ${key}`).toContain(key);
        }
      }
    }
  });
});
