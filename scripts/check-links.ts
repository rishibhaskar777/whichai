import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import {
  classify,
  stampLink,
  type Fetched,
  type LinkOutcome,
} from "../src/lib/catalogue/link-check.ts";
import { toolLinks } from "../src/lib/catalogue/links.ts";

/*
 * Requests every address in the catalogue and reports the ones that are
 * broken, moved, left the tool's own domains, or do not name the tool.
 *
 *   npm run links:check                  report only
 *   npm run links:check -- --stamp       also write linkCheckedOn for good links
 *   npm run links:check -- --json        machine-readable output
 *   npm run links:check -- --only=ollama check one tool
 *
 * Run it by hand. It is polite: a few requests at a time and a pause between
 * requests to the same host. It never changes `verified`; that is a person's
 * decision ([VERIFYING-DATA.md]).
 */

const CONCURRENCY = 6;
const HOST_PAUSE_MS = 600;
const TIMEOUT_MS = 20_000;
const MAX_BODY_BYTES = 300_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; WhichAI-link-check/1.0; +https://github.com/rishibhaskar777/whichai)";

interface ToolRecord {
  id: string;
  name: string;
  providerId: string;
  officialUrl: string;
  officialDomains: string[];
  getIt?: Record<string, unknown>;
}

interface Target {
  toolId: string;
  key: string;
  url: string;
  officialDomains: string[];
  names: string[];
  file: string | null;
}

interface Result extends Target {
  outcome: LinkOutcome;
  status: number | null;
  finalUrl: string | null;
  detail: string;
}

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsStamp = args.includes("--stamp");
const showProgress = !wantsJson && process.stderr.isTTY;
const only = args.find((arg) => arg.startsWith("--only="))?.slice(7) ?? null;

const catalogueDir = new URL("../src/data/catalogue/", import.meta.url);

function readJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

const providers = new Map(
  readJson<{ id: string; name: string }[]>(
    new URL("providers.json", catalogueDir),
  ).map((provider) => [provider.id, provider.name]),
);

function loadTargets(): Target[] {
  const targets: Target[] = [];
  const files = readdirSync(new URL("tools/", catalogueDir)).filter((name) =>
    name.endsWith(".json"),
  );
  for (const file of files) {
    const tools = readJson<ToolRecord[]>(
      new URL(`tools/${file}`, catalogueDir),
    );
    for (const tool of tools) {
      if (only && tool.id !== only) continue;
      const providerName = providers.get(tool.providerId) ?? "";
      const firstWord = tool.name.split(/[^\p{L}\p{N}]+/u)[0] ?? tool.name;
      const names = [tool.name, firstWord, providerName].filter(Boolean);
      for (const link of toolLinks(tool as never)) {
        targets.push({
          toolId: tool.id,
          key: link.key,
          url: link.url,
          officialDomains: tool.officialDomains,
          names,
          file: `tools/${file}`,
        });
      }
    }
  }
  return targets;
}

const lastRequestAt = new Map<string, number>();
const hostQueues = new Map<string, Promise<void>>();

/** Waits for this host's turn so two requests never land at the same moment. */
function takeTurn(host: string): Promise<void> {
  const previous = hostQueues.get(host) ?? Promise.resolve();
  const next = previous.then(async () => {
    const wait = (lastRequestAt.get(host) ?? 0) + HOST_PAUSE_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt.set(host, Date.now());
  });
  hostQueues.set(host, next);
  return next;
}

async function readTitle(response: Response): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BODY_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => undefined);
  const text = Buffer.concat(chunks).toString("utf8");
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(text);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

async function request(url: string, method: "HEAD" | "GET"): Promise<Fetched> {
  await takeTurn(new URL(url).hostname);
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT, "accept-language": "en" },
    });
    const title = method === "GET" ? await readTitle(response) : null;
    return {
      status: response.status,
      finalUrl: response.url,
      title,
      error: null,
    };
  } catch (error) {
    const reason =
      (error as { cause?: { code?: string } }).cause?.code ??
      (error as Error).message;
    return { status: null, finalUrl: null, title: null, error: reason };
  }
}

/** HEAD first; GET when the server dislikes HEAD or the title is needed. */
async function check(url: string): Promise<Fetched> {
  const head = await request(url, "HEAD");
  const headIsGood =
    head.status !== null && head.status < 400 && head.error === null;
  const needsTitle =
    /(?:play\.google|apps\.apple|chromewebstore|addons\.mozilla|marketplace\.|plugins\.jetbrains|huggingface)/.test(
      url,
    );
  if (headIsGood && !needsTitle) return head;
  return request(url, "GET");
}

async function run(): Promise<Result[]> {
  const targets = loadTargets();
  const unique = [...new Set(targets.map((target) => target.url))];
  const fetched = new Map<string, Fetched>();

  let next = 0;
  async function worker() {
    while (next < unique.length) {
      const url = unique[next++];
      if (url === undefined) return;
      fetched.set(url, await check(url));
      if (showProgress)
        process.stderr.write(`\rchecked ${fetched.size}/${unique.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (showProgress) process.stderr.write("\n");

  return targets.map((target) => {
    const result = fetched.get(target.url) as Fetched;
    const outcome = classify(target.url, result, target);
    const detail =
      result.error ?? (result.status !== null ? `HTTP ${result.status}` : "");
    return {
      ...target,
      outcome,
      status: result.status,
      finalUrl: result.finalUrl,
      detail:
        outcome === "name-mismatch"
          ? `${detail}, page title "${result.title ?? ""}"`
          : detail,
    };
  });
}

function section(title: string, results: Result[]): string[] {
  if (results.length === 0) return [];
  const lines = [`${title} (${results.length})`];
  for (const r of results) {
    const arrow = r.finalUrl && r.finalUrl !== r.url ? ` -> ${r.finalUrl}` : "";
    lines.push(`  ${r.toolId}  ${r.key}  ${r.detail}  ${r.url}${arrow}`);
  }
  return [...lines, ""];
}

function stamp(results: Result[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const byFile = new Map<string, Result[]>();
  for (const r of results) {
    if (r.key === "officialUrl" || r.file === null) continue;
    if (r.outcome !== "ok" && r.outcome !== "redirected") continue;
    byFile.set(r.file, [...(byFile.get(r.file) ?? []), r]);
  }
  let stamped = 0;
  for (const [file, list] of byFile) {
    const url = new URL(file, catalogueDir);
    let text = readFileSync(url, "utf8");
    for (const r of list) {
      const done = stampLink(text, r.url, today);
      text = done.text;
      if (done.changed) stamped += 1;
    }
    writeFileSync(url, text);
  }
  return stamped;
}

const results = await run();
const by = (outcome: LinkOutcome) =>
  results.filter((r) => r.outcome === outcome);

if (wantsJson) {
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} else {
  const lines = [
    `Checked ${new Set(results.map((r) => r.url)).size} addresses for ${new Set(results.map((r) => r.toolId)).size} tools.`,
    `ok ${by("ok").length}, moved ${by("redirected").length}, broken ${by("broken").length}, ` +
      `left official domains ${by("left-domain").length}, name mismatch ${by("name-mismatch").length}, ` +
      `blocked ${by("blocked").length}, unreachable ${by("unreachable").length}`,
    "",
    ...section("Broken", by("broken")),
    ...section("Left the official domains", by("left-domain")),
    ...section("Page title does not name the tool", by("name-mismatch")),
    ...section("Moved (update the stored address)", by("redirected")),
    ...section("Blocked automated requests (check by hand)", by("blocked")),
    ...section(
      "No answer (try again, or from another network)",
      by("unreachable"),
    ),
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

if (wantsStamp) {
  const count = stamp(results);
  process.stderr.write(`Stamped linkCheckedOn on ${count} addresses.\n`);
}

const problems =
  by("broken").length + by("left-domain").length + by("name-mismatch").length;
process.exitCode = problems > 0 ? 1 : 0;
