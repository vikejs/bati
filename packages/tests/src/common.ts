import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { isNode, parseDocument } from "yaml";
import packageJson from "../package.json" with { type: "json" };
import type { GlobalContext } from "./types.js";

export async function updatePackageJson(
  projectDir: string,
  flags: string[],
  packedTestsUtils?: string,
  packageManager?: string,
) {
  // add vitest and lint script
  const pkgjson = JSON.parse(await readFile(join(projectDir, "package.json"), "utf-8"));
  pkgjson.name = basename(projectDir);
  pkgjson.scripts ??= {};
  pkgjson.scripts.test = "vitest run";
  pkgjson.scripts.knip = "VITE_CJS_IGNORE_WARNING=1 knip --no-config-hints";
  if (flags.includes("eslint")) {
    pkgjson.scripts["lint:eslint"] = "eslint --max-warnings 0 .";
  }
  if (flags.includes("biome")) {
    pkgjson.scripts["lint:biome"] = "biome lint --error-on-warnings";
  }
  if (flags.includes("oxlint")) {
    pkgjson.scripts["lint:oxlint"] =
      "oxlint --max-warnings 0 --type-aware --ignore-pattern '*.spec.ts' --ignore-path .gitignore .";
  }
  // Storybook create .ts files that imports .vue files, and tsc complains about that
  if (!flags.includes("storybook") || !flags.includes("vue")) {
    pkgjson.scripts.typecheck = "tsc --noEmit";
  } else {
    pkgjson.scripts.typecheck = "echo 'typecheck skipped for storybook+vue'";
  }
  pkgjson.devDependencies ??= {};
  pkgjson.devDependencies.vitest = packageJson.devDependencies.vitest;
  pkgjson.devDependencies.knip = packageJson.devDependencies.knip;
  if (packedTestsUtils) {
    pkgjson.devDependencies["@batijs/tests-utils"] = packedTestsUtils;
  } else {
    pkgjson.devDependencies["@batijs/tests-utils"] = "link:@batijs/tests-utils";
  }
  if (packageManager) {
    pkgjson.packageManager = packageManager;
  }
  await writeFile(join(projectDir, "package.json"), JSON.stringify(pkgjson, undefined, 2), "utf-8");

  return pkgjson;
}

export async function updateTsconfig(projectDir: string) {
  // add tsconfig exclude option
  const tsconfig = JSON.parse(await readFile(join(projectDir, "tsconfig.json"), "utf-8"));
  tsconfig.exclude ??= [];
  // exclude temp vite config files
  tsconfig.exclude.push("*.timestamp-*");
  await writeFile(join(projectDir, "tsconfig.json"), JSON.stringify(tsconfig, undefined, 2), "utf-8");
}

export function updateVitestConfig(projectDir: string, testFiles?: string) {
  return writeFile(
    join(projectDir, "vitest.config.ts"),
    `/// <reference types="vitest" />
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ${testFiles ? JSON.stringify(testFiles.split(",")) : '["*.spec.ts"]'},
    testTimeout: 100000,
    forceExit: true,
  },
} as ViteUserConfig);
`,
    "utf-8",
  );
}

export async function createBatiConfig(projectDir: string, flags: string[]) {
  await writeFile(
    join(projectDir, "bati.config.json"),
    JSON.stringify({
      flags,
    }),
    "utf-8",
  );
}

export async function extractPnpmOnlyBuiltDependencies(projectDir: string, onlyBuiltDependencies: Set<string>) {
  try {
    const content = await readFile(join(projectDir, "pnpm-workspace.yaml"), "utf-8");
    const pnpmWorkspace = parseDocument(content);
    const node = pnpmWorkspace.get("onlyBuiltDependencies");
    if (isNode(node)) {
      const arr: string[] = node.toJSON();
      arr.forEach((dep: string) => {
        onlyBuiltDependencies.add(dep);
      });
      return arr;
    }
  } catch {
    // noop
  }
}

export async function createNxConfig(context: GlobalContext) {
  await writeFile(
    join(context.tmpdir, "nx.json"),
    `${JSON.stringify(
      {
        $schema: "https://nx.dev/reference/nx-json",
        tui: {
          autoExit: 0,
        },
        targetDefaults: {
          "generate-types": {
            cache: false,
          },
          build: {
            dependsOn: ["generate-types"],
            // build results are cached so that dependsOn chains (test → build,
            // lint → build, etc.) reuse the cached output instead of rebuilding
          },
          test: {
            dependsOn: ["build"],
            cache: false,
          },
          "lint:eslint": {
            dependsOn: ["build"],
            cache: false,
          },
          "lint:biome": {
            dependsOn: ["build"],
            cache: false,
          },
          "lint:oxlint": {
            dependsOn: ["build"],
            cache: false,
          },
          typecheck: {
            dependsOn: ["build"],
            cache: false,
          },
          knip: {
            dependsOn: ["build", "test"],
            cache: false,
          },
        },
      },
      undefined,
      2,
    )}\n`,

    "utf-8",
  );
}
