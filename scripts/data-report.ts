import { readFileSync, readdirSync } from "node:fs";
import { buildReport, formatReport } from "../src/lib/catalogue/report.ts";

const catalogueDir = new URL("../src/data/catalogue/", import.meta.url);

function readJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

const toolFiles = readdirSync(new URL("tools/", catalogueDir)).filter((name) =>
  name.endsWith(".json"),
);

const report = buildReport({
  tools: toolFiles.flatMap((name) =>
    readJson<never[]>(new URL(`tools/${name}`, catalogueDir)),
  ),
  jobs: readJson(new URL("jobs.json", catalogueDir)),
});

process.stdout.write(formatReport(report));
