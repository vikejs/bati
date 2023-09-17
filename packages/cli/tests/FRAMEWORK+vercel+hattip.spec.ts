import { expect, test } from "vitest";
import { describeMany } from "./utils";
import { existsSync } from "node:fs";
import path from "node:path";
import { readFile } from "node:fs/promises";

describeMany(
  ["solid", "react", "vue"],
  ["vercel", "hattip"],
  ({ context }) => {
    test("hattip build script prevails", async () => {
      const json = JSON.parse(await readFile(path.join(context.tmpdir, "package.json"), "utf-8"));

      expect(json.scripts.build).toBe("hattip build ./hattip-entry.ts --client");
    });

    test("vercel files are present", async () => {
      expect(existsSync(path.join(context.tmpdir, ".vercel", "output", "config.json"))).toBe(true);
      expect(
        existsSync(path.join(context.tmpdir, ".vercel", "output", "functions", "ssr_.func", ".vc-config.json")),
      ).toBe(true);
    });
  },
  {
    mode: "build",
  },
);
