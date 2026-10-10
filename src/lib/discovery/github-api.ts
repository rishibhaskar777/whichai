import { REQUEST_TIMEOUT_MS, SourceError, USER_AGENT } from "./http.ts";
import { BOT_LOGIN, LABELS, type ExistingIssue } from "./types.ts";

const API = "https://api.github.com";
const MAX_PAGES = 10;
const DEFAULT_WRITE_PAUSE_MS = 1000;

const LABEL_COLOURS: Record<string, { color: string; description: string }> = {
  [LABELS.candidate]: {
    color: "ededed",
    description: "A tool found by the weekly discovery job",
  },
  [LABELS.ready]: {
    color: "0e8a16",
    description: "Passes the admission rules; waiting for a person",
  },
  [LABELS.approved]: {
    color: "1d76db",
    description: "Approved; a draft catalogue record is posted",
  },
  [LABELS.rejected]: {
    color: "b60205",
    description: "Rejected; never reopened",
  },
};

export interface IssueComment {
  id: number;
  body: string;
  authorLogin: string;
}

interface RawIssue {
  number: number;
  state: string;
  labels?: ({ name?: string } | string)[];
  created_at: string;
  body?: string | null;
  user?: { login?: string } | null;
  pull_request?: unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Issues are the state store, so this is the only code that talks to GitHub
 * about them. It is bound to one repository, uses the workflow's own token,
 * and does nothing but read and write issues, labels and comments.
 */
export class IssueApi {
  readonly #repo: string;
  readonly #token: string | undefined;
  readonly #fetch: typeof fetch;
  readonly #pauseMs: number;

  constructor(
    repo: string,
    token?: string,
    fetchImpl: typeof fetch = fetch,
    pauseMs = DEFAULT_WRITE_PAUSE_MS,
  ) {
    if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo)) {
      throw new Error(`Not a repository name: ${repo}`);
    }
    this.#repo = repo;
    this.#token = token;
    this.#fetch = fetchImpl;
    this.#pauseMs = pauseMs;
  }

  async #call(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const response = await this.#fetch(`${API}/repos/${this.#repo}${path}`, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": USER_AGENT,
        ...(this.#token ? { authorization: `Bearer ${this.#token}` } : {}),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status >= 400) {
      // The response text is not logged: it could echo what was sent.
      throw new SourceError(
        `GitHub ${method} ${path.split("?")[0]} gave HTTP ${response.status}`,
      );
    }
    return (await response.json()) as unknown;
  }

  /**
   * Every issue with the tool-candidate label, open and closed, written by
   * the workflow's bot. Anything else is not machine state.
   */
  async listCandidates(): Promise<ExistingIssue[]> {
    const found: ExistingIssue[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const query = new URLSearchParams({
        labels: LABELS.candidate,
        state: "all",
        per_page: "100",
        page: String(page),
      });
      const rows = (await this.#call("GET", `/issues?${query}`)) as RawIssue[];
      for (const row of rows) {
        if (row.pull_request !== undefined) continue;
        const authorLogin = row.user?.login ?? "";
        if (authorLogin !== BOT_LOGIN) continue;
        found.push({
          number: row.number,
          state: row.state === "open" ? "open" : "closed",
          labels: (row.labels ?? []).map((label) =>
            typeof label === "string" ? label : (label.name ?? ""),
          ),
          createdAt: row.created_at,
          body: row.body ?? "",
          authorLogin,
        });
      }
      if (rows.length < 100) break;
    }
    return found;
  }

  async getIssue(number: number): Promise<ExistingIssue | null> {
    const row = (await this.#call("GET", `/issues/${number}`)) as RawIssue;
    if (row.pull_request !== undefined) return null;
    return {
      number: row.number,
      state: row.state === "open" ? "open" : "closed",
      labels: (row.labels ?? []).map((label) =>
        typeof label === "string" ? label : (label.name ?? ""),
      ),
      createdAt: row.created_at,
      body: row.body ?? "",
      authorLogin: row.user?.login ?? "",
    };
  }

  async listComments(number: number): Promise<IssueComment[]> {
    const rows = (await this.#call(
      "GET",
      `/issues/${number}/comments?per_page=100`,
    )) as {
      id: number;
      body?: string | null;
      user?: { login?: string } | null;
    }[];
    return rows.map((row) => ({
      id: row.id,
      body: row.body ?? "",
      authorLogin: row.user?.login ?? "",
    }));
  }

  async ensureLabels(): Promise<void> {
    const rows = (await this.#call("GET", "/labels?per_page=100")) as {
      name: string;
    }[];
    const present = new Set(rows.map((row) => row.name));
    for (const [name, { color, description }] of Object.entries(
      LABEL_COLOURS,
    )) {
      if (present.has(name)) continue;
      await this.#call("POST", "/labels", { name, color, description });
      await sleep(this.#pauseMs);
    }
  }

  async createIssue(
    title: string,
    body: string,
    labels: string[],
  ): Promise<number> {
    const row = (await this.#call("POST", "/issues", {
      title,
      body,
      labels,
    })) as { number: number };
    await sleep(this.#pauseMs);
    return row.number;
  }

  async updateIssue(
    number: number,
    change: { body?: string; labels?: string[]; close?: boolean },
  ): Promise<void> {
    await this.#call("PATCH", `/issues/${number}`, {
      ...(change.body === undefined ? {} : { body: change.body }),
      ...(change.labels === undefined ? {} : { labels: change.labels }),
      ...(change.close === true
        ? { state: "closed", state_reason: "not_planned" }
        : {}),
    });
    await sleep(this.#pauseMs);
  }

  async createComment(number: number, body: string): Promise<void> {
    await this.#call("POST", `/issues/${number}/comments`, { body });
    await sleep(this.#pauseMs);
  }
}
