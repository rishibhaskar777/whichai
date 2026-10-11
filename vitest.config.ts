import react from "@vitejs/plugin-react";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    // Each worker holds a jsdom per file. The 2-CPU CI runner gets two; a
    // developer machine gets half its threads so axe checks are not starved.
    maxWorkers: process.env.CI
      ? 2
      : Math.max(2, Math.floor(availableParallelism() / 2)),
  },
});
