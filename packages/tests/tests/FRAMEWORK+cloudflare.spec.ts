import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as process from "process";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["cloudflare", "react", ["hono", undefined], "eslint"] as const;

await describeBati(
  ({ test, testMatch, expect }) => {
    const worker_filepath = path.join(process.cwd(), "dist", "cloudflare", "server", "cloudflare-worker.mjs");

    test("cloudflare files are present", async () => {
      expect(existsSync(path.join(process.cwd(), "dist", "cloudflare", "_worker.js"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "dist", "cloudflare", "_routes.json"))).toBe(true);
      expect(existsSync(worker_filepath)).toBe(true);
    });

    testMatch<typeof matrix>("cloudflare-worker.mjs", {
      hono: async () => {
        const content = await readFile(worker_filepath, "utf-8");
        expect(content).toContain(`import { Hono } from "hono"`);
      },
      _: async () => {
        const content = await readFile(worker_filepath, "utf-8");
        expect(content).toContain(`import { renderPage } from "vike/server"`);
      },
    });
  },
  {
    mode: "build",
  },
);
