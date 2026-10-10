import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { DRAFT_MARKER, parseDraftComment } from "../src/lib/discovery/draft.ts";
import { IssueApi } from "../src/lib/discovery/github-api.ts";
import { checkDraft } from "../src/lib/discovery/import.ts";
import { BOT_LOGIN } from "../src/lib/discovery/types.ts";

/*
 * Adds an approved candidate to the catalogue, on your machine.
 *
 *   npm run discover:import -- <issue-number> [--repo=owner/name]
 *
 * Reads the draft record the workflow posted on the issue, validates it
 * against the catalogue schema and the cross-file checks, shows it, and asks
 * before writing. It writes the tool file and (for a new maker) providers.json,
 * then runs the data version update. It does not commit; you review and verify
 * the record first.
 */

const root = new URL("../", import.meta.url);
const cwd = fileURLToPath(root);
const catalogueDir = new URL("src/data/catalogue/", root);

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, catalogueDir), "utf8")) as T;
}

function repositoryName(): string {
  const flag = process.argv.find((arg) => arg.startsWith("--repo="));
  const named = flag?.slice("--repo=".length) ?? process.env.GITHUB_REPOSITORY;
  if (named) return named;
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd,
      encoding: "utf8",
    }).trim();
    const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(remote);
    if (match?.[1]) return match[1];
  } catch {
    // Fall through to the message below.
  }
  return fail("Could not tell the repository. Pass --repo=owner/name.");
}

const issueArgument = process.argv
  .slice(2)
  .find((arg) => !arg.startsWith("--"));
const issueNumber = Number(issueArgument);
if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
  fail("Usage: npm run discover:import -- <issue-number>");
}

const api = new IssueApi(
  repositoryName(),
  process.env.GITHUB_TOKEN || undefined,
);
const comment = (await api.listComments(issueNumber))
  .filter(
    (entry) =>
      entry.authorLogin === BOT_LOGIN && entry.body.startsWith(DRAFT_MARKER),
  )
  .at(-1);
if (comment === undefined) {
  fail(
    `Issue ${issueNumber} has no draft record from the workflow. Add the "approved" label and wait for the comment.`,
  );
}

const providers = readJson<unknown[]>("providers.json");
const toolFiles = readdirSync(new URL("tools/", catalogueDir)).filter((name) =>
  name.endsWith(".json"),
);
const check = checkDraft(parseDraftComment(comment.body), {
  providers,
  jobs: readJson("jobs.json"),
  tools: toolFiles.flatMap((name) => readJson<unknown[]>(`tools/${name}`)),
  modelClasses: readJson("model-classes.json"),
  goals: readJson("goals.json"),
});
if (!check.ok) {
  fail(
    `The draft does not pass the catalogue checks:\n${check.errors.map((line) => `  - ${line}`).join("\n")}\n\nNothing was written.`,
  );
}

const { provider, tool, providerIsNew } = check;
const toolFile = `tools/${check.category}.json`;

process.stdout.write(`\nTarget file: src/data/catalogue/${toolFile}\n`);
process.stdout.write(
  providerIsNew
    ? `New provider (added to providers.json):\n${JSON.stringify(provider, null, 2)}\n`
    : `Provider: existing "${provider.id}"\n`,
);
process.stdout.write(`\nTool record:\n${JSON.stringify(tool, null, 2)}\n\n`);

const prompt = createInterface({
  input: process.stdin,
  output: process.stdout,
});
const answer = (
  await prompt.question("Add this record? Type yes to continue: ")
)
  .trim()
  .toLowerCase();
prompt.close();
if (answer !== "yes") fail("Cancelled. Nothing was written.");

function write(path: string, value: unknown): void {
  writeFileSync(
    new URL(path, catalogueDir),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

const written = [`src/data/catalogue/${toolFile}`];
write(toolFile, [...readJson<unknown[]>(toolFile), tool]);
if (providerIsNew) {
  write("providers.json", [...providers, provider]);
  written.push("src/data/catalogue/providers.json");
}

execFileSync(
  process.execPath,
  [
    `${cwd}node_modules/prettier/bin/prettier.cjs`,
    "--write",
    ...written.map((file) => `${cwd}${file}`),
  ],
  { stdio: "inherit" },
);
execFileSync(
  process.execPath,
  [
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    `${cwd}scripts/catalogue-version.ts`,
  ],
  { stdio: "inherit", cwd },
);

process.stdout.write(`
Added "${tool.name}" (${tool.id}) as unverified.

Next steps:
  1. Review the record: summary, strengths, watch-outs, jobs and fit scores.
  2. Verify it with docs/VERIFYING-DATA.md (official page, pricing, free option,
     download links) and set verified and lastVerified only when you have.
  3. npm run data:version && npm test
  4. Commit it yourself, for example: feat(data): add ${tool.name}
  5. Close issue ${issueNumber}.
`);
