import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { isNode, parseDocument } from "yaml";
import packageJson from "../package.json" with { type: "json" };
import type { GlobalContext } from "./types.js";

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

export interface E2EWorkspaceOptions {
  /** Absolute path of the .e2e sibling directory (already created). */
  e2eDir: string;
  /** basename of the app directory we sit next to. Used to derive `../<appName>` paths. */
  appName: string;
  /** CLI flags for this matrix (used to decide which lint scripts to emit). */
  flags: string[];
  /**
   * Value for `devDependencies["@batijs/tests-utils"]`:
   *  - `"./batijs-tests-utils-X.Y.Z.tgz"` (tarball; both local and CI use this)
   *  - `"link:@batijs/tests-utils"` (fallback if a tarball is unavailable)
   */
  testsUtilsRef: string;
  /** Override vitest's `include` glob. */
  testFiles?: string;
  /** `packageManager: bun@X.Y.Z` field (CI prepare only — pins the bun version). */
  packageManagerSpec?: string;
}

/**
 * Write the sibling host-only workspace next to a generated app. The app dir
 * stays byte-identical to what the CLI emitted; everything e2e-related lives
 * here: spec files, vitest config, bati.config.json, lint/typecheck/knip
 * scripts that proxy back to the app via `cd ../<app>`.
 *
 * The build proxy keeps nx's `targetDefaults` graph happy — every dev task
 * (test, lint:*, typecheck, knip) `dependsOn: ["build"]`, so the `.e2e/`
 * project needs a `build` target of its own. It just delegates to the app.
 */
export async function createE2EWorkspace(options: E2EWorkspaceOptions) {
  const { e2eDir, appName, flags, testsUtilsRef, testFiles, packageManagerSpec } = options;
  const appRel = `../${appName}`;

  const scripts: Record<string, string> = {
    test: "vitest run",
    // Proxy the build target to the sibling app so nx can satisfy
    // `dependsOn: ["build"]` within this project.
    build: `cd ${appRel} && bun run build`,
    // knip lives in the .e2e workspace's node_modules; `--directory ../<app>` makes
    // it analyse the app while binary discovery stays here.
    knip: `VITE_CJS_IGNORE_WARNING=1 knip --no-config-hints --directory ${appRel}`,
  };
  if (flags.includes("eslint")) {
    // `bunx eslint .` runs from the app dir, so eslint resolves its binary
    // and config from the app's node_modules (eslint is a CLI-emitted devDep).
    scripts["lint:eslint"] = `cd ${appRel} && bunx eslint --max-warnings 0 .`;
  }
  if (flags.includes("biome")) {
    scripts["lint:biome"] = `cd ${appRel} && bunx biome lint --error-on-warnings`;
  }
  if (flags.includes("oxlint")) {
    scripts["lint:oxlint"] =
      `cd ${appRel} && bunx oxlint --max-warnings 0 --type-aware --ignore-pattern '*.spec.ts' --ignore-path .gitignore .`;
  }
  if (!flags.includes("storybook") || !flags.includes("vue")) {
    scripts.typecheck = `cd ${appRel} && bunx tsc --noEmit`;
  } else {
    // Storybook generates .ts files that import .vue modules and tsc objects.
    scripts.typecheck = "echo 'typecheck skipped for storybook+vue'";
  }
  if (flags.includes("cloudflare")) {
    scripts["generate-types"] = `cd ${appRel} && bun run generate-types`;
  }

  const pkgjson: Record<string, unknown> = {
    name: `${appName}-e2e`,
    private: true,
    type: "module",
    scripts,
    devDependencies: {
      vitest: packageJson.devDependencies.vitest,
      knip: packageJson.devDependencies.knip,
      "@batijs/tests-utils": testsUtilsRef,
    },
  };
  if (packageManagerSpec) {
    pkgjson.packageManager = packageManagerSpec;
  }
  await writeFile(join(e2eDir, "package.json"), JSON.stringify(pkgjson, undefined, 2), "utf-8");
  await updateVitestConfig(e2eDir, testFiles);
  await createBatiConfig(e2eDir, flags);
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
