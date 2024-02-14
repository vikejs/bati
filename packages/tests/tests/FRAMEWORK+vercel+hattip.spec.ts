import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as process from "process";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["react", "vercel", "express", "eslint"];

await describeBati(
  ({ test, expect }) => {
    test("express dev script prevails", async () => {
      const json = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf-8"));

      expect(json.scripts.dev).toContain("tsx ./express-entry.ts");
    });

    test("vercel files are present", async () => {
      expect(existsSync(path.join(process.cwd(), ".vercel", "output", "config.json"))).toBe(true);
      expect(
        existsSync(path.join(process.cwd(), ".vercel", "output", "functions", "ssr_.func", ".vc-config.json")),
      ).toBe(true);
    });
  },
  {
    mode: "build",
  },
);
