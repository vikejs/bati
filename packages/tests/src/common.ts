import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import packageJson from "../package.json";
import type { GlobalContext } from "./types.js";

export async function updatePackageJson(
  projectDir: string,
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
  if (pkgjson.scripts.lint && pkgjson.scripts.lint.includes("eslint")) {
    pkgjson.scripts.lint = pkgjson.scripts.lint.replace("eslint ", "eslint --max-warnings=0 ");
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
  pkgjson.devDependencies["happy-dom"] = packageJson.devDependencies["happy-dom"];
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
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ${testFiles ? JSON.stringify(testFiles.split(",")) : '["*.spec.ts"]'},
    testTimeout: 100000,
    environmentMatchGlobs: [
      ["**/*.dom.spec.ts", "happy-dom"],
      ["**/*.spec.ts", "node"],
    ],
  },
});
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
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**"],
        },
        test: {
          dependsOn: ["build"],
          env: ["TEST_*"],
        },
        lint: {
          dependsOn: ["build"],
        },
        typecheck: {
          dependsOn: ["build"],
        },
        knip: {
          dependsOn: ["build"],
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

export async function createKnipConfig(projectDir: string, flags: string[], scripts: Record<string, string>) {
  const ignoreDependencies = ["@batijs/tests-utils", "happy-dom"];

  if (flags.includes("eslint")) {
    ignoreDependencies.push("eslint");
  }

  if (flags.includes("react")) {
    ignoreDependencies.push("react-dom", "@types/react-dom");
  }

  if (flags.includes("vue")) {
    ignoreDependencies.push("@vue/.+");
  }

  if (flags.includes("ts-rest")) {
    ignoreDependencies.push("zod");
  }

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
        ignore: ["*.spec.ts"],
        ignoreDependencies,
        rules: {
          types: "off",
          binaries: "off",
          exports: "off",
        },
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
