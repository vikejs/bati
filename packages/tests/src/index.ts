import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { basename, join } from "node:path";
import { dirname } from "node:path/posix";
import { fileURLToPath } from "node:url";
import * as process from "process";
import { bunExists, execa, npmCli } from "@batijs/tests-utils";
import pLimit from "p-limit";
import packageJson from "../package.json";
import { execLocalBati } from "./exec-bati.js";
import { listTestFiles, loadTestFileMatrix } from "./load-test-files.js";
import { initTmpDir } from "./tmp.js";
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API = process.env.TURBO_API || "http://localhost:9999";
const TOKEN = process.env.TURBO_TOKEN || "BATI";

async function updatePackageJson(projectDir: string) {
  // add vitest and lint script
  const pkgjson = JSON.parse(await readFile(join(projectDir, "package.json"), "utf-8"));
  pkgjson.scripts ??= {};
  pkgjson.name = basename(projectDir);
  pkgjson.scripts.test = "vitest run";
  pkgjson.scripts.lint = "tsc --noEmit";
  pkgjson.devDependencies ??= {};
  pkgjson.devDependencies["@batijs/tests-utils"] = "link:@batijs/tests-utils";
  pkgjson.devDependencies.vitest = packageJson.devDependencies.vitest;
  await writeFile(join(projectDir, "package.json"), JSON.stringify(pkgjson, undefined, 2), "utf-8");
}

async function updateTsconfig(projectDir: string) {
  // add tsconfig exlude option
  const tsconfig = JSON.parse(await readFile(join(projectDir, "tsconfig.json"), "utf-8"));
  tsconfig.exclude ??= [];
  // exclude temp vite config files
  tsconfig.exclude.push("*.timestamp-*");
  await writeFile(join(projectDir, "tsconfig.json"), JSON.stringify(tsconfig, undefined, 2), "utf-8");
}

function updateVitestConfig(projectDir: string) {
  return writeFile(
    join(projectDir, "vitest.config.ts"),
    `/// <reference types="vitest" />
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ['*.spec.ts'],
    testTimeout: 100000,
  },
});`,
    "utf-8",
  );
}

function createWorkspacePackageJson(context: GlobalContext) {
  return writeFile(
    join(context.tmpdir, "package.json"),
    JSON.stringify({
      name: "bati-tests",
      private: true,
      devDependencies: {
        turbo: "latest",
      },
      ...(bunExists ? { workspaces: ["packages/*"] } : {}),
    }),
    "utf-8",
  );
}

function createPnpmWorkspaceYaml(context: GlobalContext) {
  return writeFile(
    join(context.tmpdir, "pnpm-workspace.yaml"),
    `packages:
  - "packages/*"
`,
    "utf-8",
  );
}

async function createTurboConfig(context: GlobalContext) {
  await writeFile(
    join(context.tmpdir, "turbo.json"),
    JSON.stringify({
      $schema: "https://turbo.build/schema.json",
      pipeline: {
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**"],
        },
        test: {},
        lint: {},
      },
      remoteCache: {
        signature: true,
      },
    }),
    "utf-8",
  );

  await mkdir(join(context.tmpdir, ".turbo"));

  await writeFile(
    join(context.tmpdir, ".turbo", "config.json"),
    JSON.stringify({
      teamid: "team_bati",
      apiurl: API,
    }),
    "utf-8",
  );
}

function linkTestUtils() {
  return execa(npmCli, bunExists ? ["link"] : ["link", "--global"], {
    // pnpm link --global takes some time
    timeout: 60 * 1000,
    cwd: join(__dirname, "..", "..", "tests-utils"),
  });
}

async function packageManagerInstall(context: GlobalContext) {
  // we use --prefer-offline in order to hit turborepo cache more often (as there is no bun/pnpm lock file)
  await execa(npmCli, ["install", "--prefer-offline"], {
    timeout: 60000,
    cwd: context.tmpdir,
    stdout: process.stdout,
    stderr: process.stderr,
  });

  if (!bunExists) {
    // see https://stackoverflow.com/questions/72032028/can-pnpm-replace-npm-link-yarn-link/72106897#72106897
    await execa(npmCli, ["link", "--global", "@batijs/tests-utils"], {
      timeout: 60000,
      cwd: context.tmpdir,
      stdout: process.stdout,
      stderr: process.stderr,
    });
  }
}

function execTurborepo(context: GlobalContext) {
  return execa(
    npmCli,
    [
      bunExists ? "x" : "exec",
      "turbo",
      "run",
      "test",
      "lint",
      "build",
      `--api="${API}"`,
      `--token="${TOKEN}"`,
      "--framework-inference=false",
      "--remote-only",
    ],
    {
      timeout: 60 * 10 * 1000,
      cwd: context.tmpdir,
      shell: true,
      stdout: process.stdout,
      stderr: process.stderr,
    },
  );
}

async function main(context: GlobalContext) {
  await initTmpDir(context);

  const limit = pLimit(cpus().length);
  const promises: Promise<unknown>[] = [];

  // load all test files matrices
  const testFiles = await Promise.all((await listTestFiles()).map((filepath) => loadTestFileMatrix(filepath)));

  // for all matrices
  for (const testFile of testFiles) {
    for (const flags of testFile.matrix) {
      promises.push(
        limit(async () => {
          const projectDir = await execLocalBati(context, flags);
          await Promise.all([
            copyFile(testFile.filepath, join(projectDir, "test.spec.ts")),
            updatePackageJson(projectDir),
            updateTsconfig(projectDir),
            updateVitestConfig(projectDir),
          ]);
        }),
      );
    }
  }

  // wait for concurrent cli
  await Promise.all(promises);

  await createWorkspacePackageJson(context);

  // create monorepo config  (pnpm only)
  if (!bunExists) {
    await createPnpmWorkspaceYaml(context);
  }

  // create turbo config
  await createTurboConfig(context);

  // pnpm/bun link in @batijs/tests-utils so that it can be used inside /bati/tmp/*
  await linkTestUtils();

  // pnpm/bun install
  await packageManagerInstall(context);

  // exec turbo run test lint build
  await execTurborepo(context);
}

// init context
const context: GlobalContext = { tmpdir: "" };

try {
  await main(context);
} finally {
  if (context.tmpdir) {
    // delete all tmp dirs
    await rm(context.tmpdir, { recursive: true, force: true });
  }
}
