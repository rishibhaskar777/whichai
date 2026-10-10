import { describe, expect, it } from "vitest";
import { evaluateAdmission } from "./admission";
import { cleanCandidate } from "./clean";
import configJson from "@/data/discovery/config.json";
import { parseConfig } from "./config";
import { decodeState, encodeState, issueTitle, renderBody } from "./state";
import type { CandidateState, RawCandidate } from "./types";

const config = parseConfig(configJson);

function state(overrides: Partial<CandidateState> = {}): CandidateState {
  return {
    version: 1,
    id: "foo",
    name: "Foo",
    description: "Turns notes into slides",
    homepage: "https://foo.example/",
    repository: "https://github.com/maker/foo",
    announcement: null,
    maintainer: "maker",
    kind: "ai-tool",
    keys: ["repo:github.com/maker/foo", "name:foo"],
    sources: [{ source: "github", url: "https://github.com/maker/foo" }],
    topics: ["ai"],
    jobs: ["presentation-maker"],
    firstSeen: "2026-09-01",
    lastSeen: "2026-10-08",
    history: [
      { date: "2026-09-01", signals: { githubStars: 500 } },
      { date: "2026-10-08", signals: { githubStars: 900, hnPoints: 80 } },
    ],
    homepageCheck: null,
    ...overrides,
  };
}

function view(candidate: CandidateState) {
  return {
    admission: evaluateAdmission({
      state: candidate,
      firstSeen: candidate.firstSeen,
      now: new Date("2026-10-10T00:00:00Z"),
      config,
      duplicate: null,
      rejectedReason: null,
    }),
    closest: [
      { id: "gamma", name: "Gamma", sharedJobs: ["presentation-maker"] },
    ],
    jobNames: new Map([["presentation-maker", "Presentation maker"]]),
  };
}

/** The body with code spans, code blocks and the hidden block removed. */
function outsideCode(body: string): string {
  return body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/<https:\/\/[^>\s]*>/g, "");
}

describe("the hidden state block", () => {
  it("round-trips through an issue body", () => {
    const original = state();
    const body = renderBody(original, view(original));
    expect(decodeState(body)).toEqual(original);
  });

  it("is a single HTML comment that cannot be closed early", () => {
    const hostile = state({
      description: "--> <!-- whichai-candidate {} --> <b>x</b> -- y",
    });
    const block = encodeState(hostile);
    expect(block.startsWith("<!-- whichai-candidate ")).toBe(true);
    expect(block.endsWith(" -->")).toBe(true);
    const inner = block.slice("<!-- ".length, -" -->".length);
    expect(inner).not.toMatch(/[<>]/);
    expect(inner).not.toContain("--");
    expect(decodeState(`text\n${block}`)).toEqual(hostile);
  });

  it("uses the last block, so text above it cannot replace the state", () => {
    const real = state();
    const fake = encodeState(state({ id: "fake", name: "Fake" }));
    const body = `${fake}\nvisible text\n${encodeState(real)}`;
    expect(decodeState(body)?.id).toBe("foo");
  });

  it.each([
    ["no block", "just text"],
    ["broken json", "<!-- whichai-candidate {oops -->"],
    ["no end", "<!-- whichai-candidate {}"],
    ["wrong version", encodeState({ ...state(), version: 2 as 1 })],
    [
      "extra field",
      encodeState({ ...state(), admin: true } as unknown as CandidateState),
    ],
    [
      "too many snapshots",
      encodeState(
        state({
          history: Array.from({ length: 40 }, (_, day) => ({
            date: `2026-09-${String((day % 28) + 1).padStart(2, "0")}`,
            signals: {},
          })),
        }),
      ),
    ],
    [
      "a source address that is not https",
      encodeState(
        state({ sources: [{ source: "github", url: "http://evil.example/" }] }),
      ),
    ],
  ])("returns null for %s", (_label, body) => {
    expect(decodeState(body)).toBeNull();
  });

  it("drops an address that is not https instead of trusting it", () => {
    const edited = encodeState(state({ homepage: "http://foo.example/" }));
    expect(decodeState(edited)?.homepage).toBeNull();
  });

  it("drops a javascript address", () => {
    const edited = encodeState(
      state({ repository: "javascript:alert(1)" as string }),
    );
    expect(decodeState(edited)?.repository).toBeNull();
  });
});

describe("a body made from hostile data", () => {
  const raw: RawCandidate = {
    source: "hackernews",
    name: "@everyone #1 `evil` [click](https://evil.example)",
    description:
      "Great! <script>alert(1)</script> cc @octocat fixes #123 owner/repo#4 ```\n" +
      '<!-- whichai-candidate {"id":"x"} -->‮ ' +
      "x".repeat(5000),
    homepage: "javascript:alert(1)",
    repository: "https://github.com/evil/evil",
    announcement: "http://insecure.example/",
    maintainer: "@maintainer\u0000",
    topics: ["ai", "<img src=x>"],
    kindHint: null,
    seenUrl: "https://news.ycombinator.com/item?id=1",
    signals: { hnPoints: 100 },
  };
  const candidate = cleanCandidate(raw)!;
  const stateFromRaw: CandidateState = {
    version: 1,
    id: candidate.id,
    name: candidate.name,
    description: candidate.description,
    homepage: candidate.homepage,
    repository: candidate.repository,
    announcement: candidate.announcement,
    maintainer: candidate.maintainer,
    kind: candidate.kind,
    keys: candidate.keys,
    sources: candidate.sources,
    topics: candidate.topics,
    jobs: [],
    firstSeen: "2026-10-01",
    lastSeen: "2026-10-01",
    history: [{ date: "2026-10-01", signals: candidate.signals }],
    homepageCheck: null,
  };
  const body = renderBody(stateFromRaw, view(stateFromRaw));

  it("keeps only https addresses", () => {
    expect(candidate.homepage).toBeNull();
    expect(candidate.announcement).toBeNull();
    expect(candidate.repository).toBe("https://github.com/evil/evil");
  });

  it("creates no mention, issue reference, link or tag outside code", () => {
    const visible = outsideCode(body);
    expect(visible).not.toMatch(/@\w/);
    expect(visible).not.toMatch(/#\d/);
    expect(visible).not.toMatch(/\]\(/);
    expect(visible).not.toMatch(/<\w/);
    expect(visible).not.toMatch(/https?:\/\//);
  });

  it("contains no raw script, no control character and one state block", () => {
    expect(body).not.toContain("<script");
    expect(body).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f‮]/);
    expect(body.match(/<!-- whichai-candidate /g)).toHaveLength(1);
    expect(decodeState(body)?.name).toBe(candidate.name);
  });

  it("limits the description", () => {
    expect(candidate.description.length).toBeLessThanOrEqual(300);
    expect(body.length).toBeLessThan(8000);
  });

  it("makes a title with no mention or reference", () => {
    const title = issueTitle(stateFromRaw);
    expect(title).not.toMatch(/[@#`[\]()<>]/);
    expect(title.startsWith("Tool candidate: ")).toBe(true);
  });
});

describe("the readable part of a body", () => {
  it("shows rules, signals and the closest existing tools", () => {
    const candidate = state();
    const body = renderBody(candidate, view(candidate));
    expect(body).toContain("### Admission rules");
    expect(body).toContain("- [x] 2. First seen at least 30 days ago");
    expect(body).toContain("GitHub stars: 900");
    expect(body).toContain("`Gamma` (`Presentation maker`)");
    expect(body).toContain("never decides which tool is better");
  });
});
