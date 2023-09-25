import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { describeMany } from "./utils.js";

describeMany(
  ["solid", "react", "vue"],
  ["vercel"],
  ({ context }) => {
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
