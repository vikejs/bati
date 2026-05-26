import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describeBati, suite } from "@batijs/tests-utils";

// Each combo enables exactly ONE linter (to verify other linters' comments
// have been stripped). No `.linters()` call — the linter is a real matrix
// dimension here.
const tests = suite().matrix({
  framework: "react",
  data: "ts-rest",
  server: "hono",
  linter: ["eslint", "biome", "oxlint"],
});

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

await describeBati(
  ({ expect, testMatch }) => {
    const ignoredFolders = ["node_modules", ".git", "dist", "build"];

    async function* listFiles(dir = "."): AsyncGenerator<string> {
      const absoluteDir = resolve(dir);
      const entries = await readdir(absoluteDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(absoluteDir, entry.name);

        if (entry.isDirectory()) {
          if (!ignoredFolders.includes(entry.name)) {
            yield* listFiles(fullPath);
          }
        } else {
          if (/[mc]?[jt]sx?/.test(entry.name) && !/\.(spec|test)\./.test(entry.name)) {
            yield fullPath;
          }
        }
      }
    }

    testMatch<TestFlags>("home", {
      eslint: async () => {
        expect.hasAssertions();
        for await (const file of listFiles()) {
          const content = await readFile(file, "utf8");
          expect(content).not.toContain("biome-");
          expect(content).not.toContain("oxlint-");
        }
      },
      biome: async () => {
        expect.hasAssertions();
        for await (const file of listFiles()) {
          const content = await readFile(file, "utf8");
          expect(content).not.toContain("eslint-");
        }
      },
      oxlint: async () => {
        expect.hasAssertions();
        for await (const file of listFiles()) {
          const content = await readFile(file, "utf8");
          expect(content).not.toContain("biome-");
        }
      },
    });
  },
  {
    mode: "none",
  },
);
