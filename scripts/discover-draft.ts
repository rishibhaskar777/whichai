import {
  DRAFT_MARKER,
  buildDraft,
  renderDraftComment,
} from "../src/lib/discovery/draft.ts";
import { loadFiles } from "../src/lib/discovery/files.ts";
import { IssueApi } from "../src/lib/discovery/github-api.ts";
import { decodeState } from "../src/lib/discovery/state.ts";
import { BOT_LOGIN, LABELS } from "../src/lib/discovery/types.ts";
import { toolSchema } from "../src/lib/schemas/catalogue.ts";

/*
 * Runs when the "approved" label is added to a candidate issue. Posts one
 * comment with a draft catalogue record. It reads the issue through the API
 * (never from the event text) and changes nothing else.
 *
 *   ISSUE_NUMBER=12 GITHUB_REPOSITORY=owner/name GITHUB_TOKEN=... \
 *     node scripts/discover-draft.ts
 */

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const number = Number(process.env.ISSUE_NUMBER);
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!Number.isInteger(number) || number <= 0)
  fail("ISSUE_NUMBER must be a number.");
if (!repo || !token) fail("GITHUB_REPOSITORY and GITHUB_TOKEN are required.");

const api = new IssueApi(repo, token);
const issue = await api.getIssue(number);
if (issue === null) fail("That is a pull request, not a candidate.");
if (
  issue.authorLogin !== BOT_LOGIN ||
  !issue.labels.includes(LABELS.candidate)
) {
  fail("Not a candidate issue written by the discovery job. Nothing posted.");
}
if (!issue.labels.includes(LABELS.approved)) fail("The issue is not approved.");

const state = decodeState(issue.body);
if (state === null) fail("The candidate's state block could not be read.");

const comments = await api.listComments(number);
if (comments.some((comment) => comment.body.startsWith(DRAFT_MARKER))) {
  process.stdout.write("A draft was already posted. Nothing to do.\n");
  process.exit(0);
}

const files = loadFiles(new URL("../", import.meta.url));
const draft = buildDraft(state, {
  providers: files.providers,
  toolIds: new Set(files.tools.map((tool) => tool.id)),
});
const checked = toolSchema.safeParse(draft.tool);
if (!checked.success) {
  fail(
    `The draft record does not match the catalogue schema:\n${checked.error.message}`,
  );
}

await api.createComment(number, renderDraftComment(draft, number));
process.stdout.write(`Posted a draft record for issue ${number}.\n`);
