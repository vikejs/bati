import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["react", "ts-rest", "hono", ["eslint", "biome", "oxlint"]];

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

    testMatch<typeof matrix>("home", {
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
