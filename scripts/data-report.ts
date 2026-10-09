import { readFileSync } from "node:fs";
import { buildReport, formatReport } from "../src/lib/catalogue/report.ts";

function readJson<T>(name: string): T {
  const url = new URL(`../src/data/catalogue/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

const report = buildReport({
  tools: readJson("tools.json"),
  jobs: readJson("jobs.json"),
});

process.stdout.write(formatReport(report));
