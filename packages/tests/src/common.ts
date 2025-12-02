import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isNode, parseDocument } from "yaml";
import type { BatiConfig, BatiKnipConfig } from "@batijs/core/config";
import { BatiSet, features, type Flags } from "@batijs/features";
import packageJson from "../package.json" with { type: "json" };
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";

export async function updatePackageJson(
  projectDir: string,
  flags: string[],
  packedTestsUtils?: string,
  packageManager?: string,
  addTurbo?: boolean,
) {
  // add vitest and lint script
  const pkgjson = JSON.parse(await readFile(join(projectDir, "package.json"), "utf-8"));
  pkgjson.name = basename(projectDir);
  pkgjson.scripts ??= {};
  pkgjson.scripts.test = "vitest run";
  pkgjson.scripts.knip = "VITE_CJS_IGNORE_WARNING=1 knip";
  if (flags.includes("eslint")) {
    pkgjson.scripts["lint:eslint"] = "eslint --max-warnings 0 .";
  }
  if (flags.includes("biome")) {
    pkgjson.scripts["lint:biome"] = "biome lint --error-on-warnings";
  }
  if (flags.includes("oxlint")) {
    pkgjson.scripts["lint:oxlint"] = "oxlint --type-aware --ignore-path .gitignore .";
  }
  pkgjson.scripts.typecheck = "tsc --noEmit";
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
  if (addTurbo) {
    pkgjson.devDependencies.turbo = packageJson.devDependencies.turbo;
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
  },
} as ViteUserConfig);
`,
    "utf-8",
  );
}

export async function createTurboConfig(context: GlobalContext) {
  await writeFile(
    join(context.tmpdir, "turbo.json"),
    JSON.stringify({
      $schema: "https://turbo.build/schema.json",
      tasks: {
        "generate-types": {
          outputs: ["worker-configuration.d.ts"],
        },
        build: {
          dependsOn: ["^build", "generate-types"],
          outputs: ["dist/**"],
        },
        test: {
          dependsOn: ["generate-types", "build"],
          env: ["TEST_*"],
        },
        "lint:eslint": {
          dependsOn: ["generate-types", "build"],
        },
        "lint:biome": {
          dependsOn: ["generate-types", "build"],
        },
        "lint:oxlint": {
          dependsOn: ["build"],
        },
        typecheck: {
          dependsOn: ["generate-types", "build"],
        },
        knip: {
          // adding "test" because of possible race conditions as knip can execute some files
          dependsOn: ["build", "test"],
        },
      },
      daemon: false,
      remoteCache: {
        signature: false,
      },
    }),
    "utf-8",
  );
}

interface BoilerplateDef {
  folder: string;
  subfolders: string[];
}

interface BoilerplateDefWithConfig extends BoilerplateDef {
  config: BatiConfig;
}

function boilerplatesDir() {
  // When running from tests package
  const cliDir = join(__dirname, "..", "..", "cli", "dist", "boilerplates");
  return cliDir;
}

async function loadBoilerplates(dir: string): Promise<BoilerplateDefWithConfig[]> {
  const boilerplates: BoilerplateDef[] = JSON.parse(await readFile(join(dir, "boilerplates.json"), "utf-8"));

  return await Promise.all(
    boilerplates.map(async (bl) => {
      const batiConfigFile = join(dir, bl.folder, "bati.config.js");
      const importFile = isWin ? `file://${batiConfigFile}` : batiConfigFile;
      const { default: batiConfig }: { default: BatiConfig } = await import(importFile);
      return {
        ...bl,
        config: batiConfig,
      };
    }),
  );
}

export async function aggregateKnipConfigs(flags: string[]): Promise<BatiKnipConfig> {
  const dir = boilerplatesDir();
  const boilerplates = await loadBoilerplates(dir);

  const meta = {
    BATI: new BatiSet(flags as Flags[], features),
  };

  const aggregated: BatiKnipConfig = {
    entry: [],
    ignore: [],
    ignoreDependencies: [],
    vite: true,
  };

  for (const bl of boilerplates) {
    // Check if this boilerplate applies based on its `if` condition
    if (bl.config.if && !bl.config.if(meta)) {
      continue;
    }

    // Aggregate knip configs
    if (bl.config.knip) {
      if (bl.config.knip.entry) {
        aggregated.entry!.push(...bl.config.knip.entry);
      }
      if (bl.config.knip.ignore) {
        aggregated.ignore!.push(...bl.config.knip.ignore);
      }
      if (bl.config.knip.ignoreDependencies) {
        aggregated.ignoreDependencies!.push(...bl.config.knip.ignoreDependencies);
      }
      if (bl.config.knip.vite === false) {
        aggregated.vite = false;
      }
    }
  }

  return aggregated;
}

export async function createKnipConfig(projectDir: string, flags: string[], scripts: Record<string, string>) {
  // Aggregate knip configs from boilerplates
  const aggregated = await aggregateKnipConfigs(flags);

  const entry = aggregated.entry ?? [];
  const ignore = aggregated.ignore ?? [];
  const ignoreDependencies = aggregated.ignoreDependencies ?? [];
  const vite = aggregated.vite ?? true;

  // Dynamic script-based checks that can't be defined in bati.config.ts
  const scriptsValues = Array.from(Object.values(scripts));

  if (scriptsValues.some((s) => s.includes("tsx "))) {
    ignoreDependencies.push("tsx");
  }

  if (scriptsValues.some((s) => s.includes("cross-env "))) {
    ignoreDependencies.push("cross-env");
  }

  await writeFile(
    join(projectDir, "knip.json"),
    JSON.stringify(
      {
        $schema: "https://unpkg.com/knip@5/schema.json",
        entry,
        ignore,
        ignoreDependencies,
        rules: {
          types: "off",
          binaries: "off",
          exports: "off",
        },
        vite,
      },
      undefined,
      2,
    ),
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
