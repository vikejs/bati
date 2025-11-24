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
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**"],
        },
        test: {
          dependsOn: ["build"],
          env: ["TEST_*"],
        },
        "lint:eslint": {
          dependsOn: ["build"],
        },
        "lint:biome": {
          dependsOn: ["build"],
        },
        typecheck: {
          dependsOn: ["build"],
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

export async function createKnipConfig(projectDir: string, flags: string[], scripts: Record<string, string>) {
  const ignoreDependencies = ["@batijs/tests-utils", "turbo", "photon"];
  const entry: string[] = [];
  const ignore: string[] = ["*.spec.ts"];

  function addPhotonConfig() {
    entry.push("server/entry.ts");
  }

  if (flags.includes("eslint")) {
    ignoreDependencies.push("eslint");
  }

  if (flags.includes("biome")) {
    ignoreDependencies.push("@biomejs/biome");
  }

  if (flags.includes("prettier")) {
    ignoreDependencies.push("prettier");

    if (flags.includes("eslint")) {
      ignoreDependencies.push("eslint-config-prettier");
    }
  }

  if (flags.includes("react")) {
    ignoreDependencies.push("react-dom", "@types/react-dom");
  }

  if (flags.includes("vue")) {
    ignoreDependencies.push("@vue/.+");
  }

  if (flags.includes("tailwindcss")) {
    ignoreDependencies.push("tailwindcss");
  }

  if (flags.includes("daisyui")) {
    ignoreDependencies.push("tailwindcss", "daisyui");
  }

  if (flags.includes("mantine")) {
    ignoreDependencies.push("postcss");
  }

  // With compiled-css -> Error while parsing vite.config.ts
  if (flags.includes("compiled-css")) {
    ignore.push("vite.config.ts");
    ignoreDependencies.push("@compiled/react", "@vitejs/plugin-react", "vite-plugin-compiled-react");
  }

  if (flags.includes("prisma")) {
    ignoreDependencies.push("@prisma/client", "prisma");
  }

  if (flags.includes("ts-rest")) {
    ignoreDependencies.push("zod");
  }

  if (flags.includes("hono")) {
    addPhotonConfig();
  }

  if (flags.includes("h3")) {
    addPhotonConfig();
  }

  if (flags.includes("express")) {
    addPhotonConfig();
  }

  if (flags.includes("fastify")) {
    addPhotonConfig();
  }

  if (flags.includes("cloudflare")) {
    entry.push("cloudflare-entry.ts");
    ignoreDependencies.push("@cloudflare/workers-types", "wrangler", "cloudflare", "@photonjs/cloudflare");
  }

  if (flags.includes("vercel")) {
    ignoreDependencies.push("vite-plugin-vercel", "@photonjs/vercel");
    ignore.push(".vercel/**");
  }

  if (flags.includes("aws")) {
    entry.push("entry_aws_lambda.ts");
    entry.push("cdk/lib/vike-stack.ts");
    entry.push("tests/aws_handler.spec.ts");
    ignoreDependencies.push("aws-cdk", "cdk", "esbuild", "npm-run-all2");
    ignore.push("cdk.out/**");
  }

  if (flags.includes("auth0") || flags.includes("authjs")) {
    entry.push("server/authjs-handler.ts");
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
        entry,
        ignore,
        ignoreDependencies,
        rules: {
          types: "off",
          binaries: "off",
          exports: "off",
        },
        // With compiled-css -> Error while parsing vite.config.ts
        vite: !flags.includes("compiled-css"),
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

export async function updateViteConfig(projectDir: string) {
  // add tsconfig exclude option
  let viteConfig = await readFile(join(projectDir, "vite.config.json"), "utf-8");
  // disable HMR for concurrency
  viteConfig = viteConfig.replace(
    "export default defineConfig({",
    "export default defineConfig({ server: { hmr: false },",
  );
  await writeFile(join(projectDir, "vite.config.json"), viteConfig, "utf-8");
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
