import { readFileSync, readdirSync } from "node:fs";
import { parseConfig, parseRejected } from "./config.ts";
import { buildIndex } from "./match.ts";
import type { IndexedProvider, IndexedTool } from "./match.ts";
import type { JobInfo, ToolInfo } from "./jobs.ts";
import type { NewsSource } from "../news/types.ts";

/*
 * Reads the repository's data files for the scripts. Everything here is JSON
 * in the repository; nothing is fetched.
 */

interface ToolRecord extends IndexedTool {
  name: string;
  jobs: string[];
  fitScores: Record<string, number>;
}

interface JobRecord extends JobInfo {
  category: string;
}

export interface DiscoveryFiles {
  config: ReturnType<typeof parseConfig>;
  rejected: ReturnType<typeof parseRejected>;
  providers: (IndexedProvider & { homepage: string })[];
  jobs: JobRecord[];
  tools: ToolRecord[];
  newsSources: NewsSource[];
  index: ReturnType<typeof buildIndex>;
  toolInfos: ToolInfo[];
}

function readJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

export function loadFiles(root: URL): DiscoveryFiles {
  const data = new URL("src/data/", root);
  const catalogue = new URL("catalogue/", data);
  const toolFiles = readdirSync(new URL("tools/", catalogue)).filter((name) =>
    name.endsWith(".json"),
  );
  const tools = toolFiles.flatMap((name) =>
    readJson<ToolRecord[]>(new URL(`tools/${name}`, catalogue)),
  );
  const providers = readJson<DiscoveryFiles["providers"]>(
    new URL("providers.json", catalogue),
  );
  return {
    config: parseConfig(readJson(new URL("discovery/config.json", data))),
    rejected: parseRejected(readJson(new URL("discovery/rejected.json", data))),
    providers,
    jobs: readJson<JobRecord[]>(new URL("jobs.json", catalogue)),
    tools,
    newsSources: readJson<NewsSource[]>(new URL("news/sources.json", data)),
    index: buildIndex(tools, providers),
    toolInfos: tools,
  };
}
