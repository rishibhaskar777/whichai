import { describe, expect, it } from "vitest";
import { IssueApi } from "./github-api";

interface Call {
  method: string;
  url: string;
  body: unknown;
  headers: Record<string, string>;
}

function fakeFetch(
  respond: (call: Call) => { status?: number; json: unknown },
): { fetchImpl: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const call: Call = {
      method: init.method ?? "GET",
      url,
      body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
      headers: init.headers as Record<string, string>,
    };
    calls.push(call);
    const { status = 200, json } = respond(call);
    return new Response(JSON.stringify(json), { status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const bot = { login: "github-actions[bot]" };

describe("IssueApi", () => {
  it("rejects a repository name that is not owner/name", () => {
    expect(() => new IssueApi("../etc/passwd", "t")).toThrow();
    expect(() => new IssueApi("owner", "t")).toThrow();
  });

  it("lists only candidates the bot wrote, and skips pull requests", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      json: [
        {
          number: 1,
          state: "open",
          labels: [{ name: "tool-candidate" }, "ready-for-review"],
          created_at: "2026-09-01T00:00:00Z",
          body: "b",
          user: bot,
        },
        {
          number: 2,
          state: "open",
          labels: [{ name: "tool-candidate" }],
          created_at: "2026-09-01T00:00:00Z",
          body: "forged",
          user: { login: "stranger" },
        },
        {
          number: 3,
          state: "closed",
          labels: [],
          created_at: "2026-09-01T00:00:00Z",
          body: "pr",
          user: bot,
          pull_request: {},
        },
      ],
    }));
    const api = new IssueApi("owner/repo", "token", fetchImpl, 0);
    const found = await api.listCandidates();
    expect(found.map((issue) => issue.number)).toEqual([1]);
    expect(found[0]!.labels).toEqual(["tool-candidate", "ready-for-review"]);
    expect(calls[0]!.url).toContain("/repos/owner/repo/issues?");
    expect(calls[0]!.url).toContain("labels=tool-candidate");
    expect(calls[0]!.url).toContain("state=all");
    expect(calls[0]!.headers.authorization).toBe("Bearer token");
  });

  it("creates only the missing labels", async () => {
    const { fetchImpl, calls } = fakeFetch((call) =>
      call.method === "GET"
        ? { json: [{ name: "tool-candidate" }, { name: "rejected" }] }
        : { json: {} },
    );
    await new IssueApi("owner/repo", "token", fetchImpl, 0).ensureLabels();
    const created = calls
      .filter((call) => call.method === "POST")
      .map((call) => (call.body as { name: string }).name);
    expect(created).toEqual(["ready-for-review", "approved"]);
  });

  it("closes as not planned and edits labels and body", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ json: {} }));
    const api = new IssueApi("owner/repo", "token", fetchImpl, 0);
    await api.updateIssue(5, { close: true });
    await api.updateIssue(6, { body: "new", labels: ["tool-candidate"] });
    expect(calls[0]!.body).toEqual({
      state: "closed",
      state_reason: "not_planned",
    });
    expect(calls[1]!.body).toEqual({ body: "new", labels: ["tool-candidate"] });
    expect(calls.every((call) => call.method === "PATCH")).toBe(true);
  });

  it("only ever calls the issues, labels and comments of its own repository", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ json: [] }));
    const api = new IssueApi("owner/repo", "token", fetchImpl, 0);
    await api.listCandidates();
    await api.listComments(3);
    await api.ensureLabels();
    await api.createIssue("t", "b", ["tool-candidate"]);
    await api.createComment(3, "hi");
    for (const call of calls) {
      const path = new URL(call.url).pathname;
      expect(path).toMatch(
        /^\/repos\/owner\/repo\/(issues|labels)(\/\d+(\/comments)?)?$/,
      );
    }
  });

  it("does not put a response body into an error", async () => {
    const { fetchImpl } = fakeFetch(() => ({
      status: 422,
      json: { message: "secret echo token=abc" },
    }));
    const api = new IssueApi("owner/repo", "token", fetchImpl, 0);
    await expect(api.createIssue("t", "b", [])).rejects.toThrow(/HTTP 422$/);
  });
});
