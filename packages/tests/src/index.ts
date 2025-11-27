import { copyFile, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { cpus, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";
import { exec, npmCli, zx } from "@batijs/tests-utils";
import dotenv from "dotenv";
import mri from "mri";
import pLimit from "p-limit";

import { Document, parseDocument, YAMLMap, YAMLSeq } from "yaml";
import packageJson from "../package.json" with { type: "json" };
import {
  createBatiConfig,
  createKnipConfig,
  createTurboConfig,
  extractPnpmOnlyBuiltDependencies,
  updatePackageJson,
  updateTsconfig,
  updateVitestConfig,
} from "./common.js";
import { execLocalBati } from "./exec-bati.js";
import { listTestFiles, loadTestFileMatrix } from "./load-test-files.js";
import { initTmpDir } from "./tmp.js";
import type { GlobalContext } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..", "..", "..");

interface CliOptions {
  filter?: string;
  steps?: string;
  force?: boolean;
  summarize?: boolean;
  keep?: boolean;
  // number of GitHub worflows that will run in parallel.
  // If value is 10, and 180 tests need to run, we will have 180 / 10 = 18 tests per worflow
  workers?: number;
}

async function getPackageManagerVersion() {
  const process = exec(npmCli, ["--version"], {
    timeout: 5 * 1000, // 5sec
    stdio: "pipe",
  });

  let version = "";

  process.stdout!.on("data", (data) => {
    version += data.toString();
  });

  await process;

  return version.trim();
}

async function createWorkspacePackageJson(context: GlobalContext) {
  const version = await getPackageManagerVersion();

  return writeFile(
    join(context.tmpdir, "package.json"),
    JSON.stringify({
      name: "bati-tests",
      private: true,
      devDependencies: {
        turbo: packageJson.devDependencies.turbo,
      },
      ...(npmCli === "bun" ? { workspaces: ["packages/*"] } : {}),
      packageManager: `${npmCli}@${version}`,
    }),
    "utf-8",
  );
}

function createPnpmWorkspaceYaml(context: GlobalContext, onlyBuiltDependencies: Set<string>) {
  const doc = new Document();
  doc.set("packages", ["packages/*"]);
  if (onlyBuiltDependencies.size > 0) {
    doc.set("onlyBuiltDependencies", [...onlyBuiltDependencies]);
  }
  return writeFile(join(context.tmpdir, "pnpm-workspace.yaml"), doc.toString(), "utf-8");
}

async function createGitIgnore(context: GlobalContext) {
  await copyFile(join(root, ".gitignore"), join(context.tmpdir, ".gitignore"));
}

function linkTestUtils() {
  return exec(npmCli, npmCli === "bun" ? ["link"] : ["link", "--loglevel", "error"], {
    // pnpm link can take some time
    timeout: 60 * 1000,
    cwd: join(__dirname, "..", "..", "tests-utils"),
  });
}

async function packageManagerInstall(context: GlobalContext) {
  {
    // we use --prefer-offline in order to hit turborepo cache more often (as there is no bun/pnpm lock file)
    const child = exec(npmCli, ["install", "--prefer-offline", ...(npmCli === "bun" ? ["--linker", "isolated"] : [])], {
      // really slow on Windows CI
      timeout: 5 * 60 * 1000,
      cwd: context.tmpdir,
      stdio: ["ignore", "ignore", "inherit"],
    });

    await child;
  }

  if (npmCli === "bun") {
    // Circumvent https://github.com/aws/aws-cdk/issues/33270
    await writeFile(join(context.tmpdir, "bun.lockb"), "", "utf-8");
  } else {
    // see https://stackoverflow.com/questions/72032028/can-pnpm-replace-npm-link-yarn-link/72106897#72106897
    const child = exec(npmCli, ["link", "@batijs/tests-utils"], {
      timeout: 60000,
      cwd: context.tmpdir,
      stdio: ["ignore", "ignore", "inherit"],
    });

    await child;
  }
}

async function pnpmRebuild(projectDirs: string[]) {
  for (const projectDir of projectDirs) {
    await exec(npmCli, ["rebuild"], {
      timeout: 60 * 1000, // 1min
      cwd: projectDir,
    });
  }
}

async function execTurborepo(context: GlobalContext, args: mri.Argv<CliOptions>) {
  const steps = args.steps ? args.steps.split(",") : undefined;
  const args_1 = [npmCli === "bun" ? "x" : "exec", "turbo", "run"];
  const args_2 = ["--no-update-notifier", "--framework-inference", "false", "--env-mode", "loose"];

  const cacheDir = process.env.CI ? false : join(tmpdir(), "bati-cache");
  if (cacheDir) {
    console.log("[turborepo] Using cache dir", cacheDir);
    args_2.push(`--cache-dir`);
    args_2.push(cacheDir);
  }

  // GitHub CI seems to fail more often with default concurrency
  // Also local tests with @cloudflare/vite-plugin can easily crash because of memory overflow without it
  args_2.push("--concurrency");
  args_2.push("3");

  if (args.force) {
    args_2.push("--force");
  }

  if (args.summarize) {
    // Debug cache hits
    args_2.push("--summarize");
  }

  await exec(
    npmCli,
    [
      ...args_1,
      ...(steps ?? ["generate-types", "build", "test", "lint:eslint", "lint:biome", "typecheck", "knip"]),
      ...args_2,
    ],
    {
      timeout: 35 * 60 * 1000, // 35min
      cwd: context.tmpdir,
    },
  );
}

function isVerdaccioRunning() {
  return new Promise<boolean>((resolve) => {
    const req = http.get("http://localhost:4873/registry", {
      timeout: 4000,
    });
    req.on("error", () => resolve(false));
    req.on("close", () => resolve(true));

    req.end();
  });
}

function loadDotEnvTest() {
  dotenv.config({
    path: join(root, ".env.test"),
  });
  // For sqlite tests
  process.env.DATABASE_URL ??= "sqlite.db";
}

function areAllElementsOfAIncludedInB(a: string[], b: string[]) {
  if (a.length === 0) throw new Error("arrayIncludes first parameter should not be an empty array");
  return a.every((element) => b.includes(element));
}

async function spinner<T>(title: string, callback: () => T): Promise<T> {
  if (process.env.CI) {
    return callback();
  }
  return zx.spinner(title, callback);
}

// biome-ignore lint/correctness/noUnusedVariables: util
function chunkArray<T>(arr: T[], maxChunks: number): T[][] {
  if (maxChunks <= 0) throw new Error("The number of chunks must be greater than 0");

  const result: T[][] = [];
  const chunkSize = Math.ceil(arr.length / Math.min(arr.length, maxChunks));

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
}

async function main(context: GlobalContext, args: mri.Argv<CliOptions>) {
  const command: string | undefined = args._[0];
  let filter = args.filter ? args.filter.split(",") : undefined;
  const exclude = filter ? filter.filter((f) => f.startsWith("!")).map((f) => f.slice(1)) : undefined;

  if (filter) {
    filter = filter.filter((f) => !f.startsWith("!"));
  }

  const limit = pLimit(cpus().length);
  const promises: Promise<unknown>[] = [];
  const matrices: Map<
    string,
    {
      testFiles: string[];
      flags: string[];
    }
  > = new Map();

  loadDotEnvTest();

  const testFiles = await spinner("Loading all test files matrices...", async () =>
    Promise.all((await listTestFiles()).map((filepath) => loadTestFileMatrix(filepath))),
  );

  for (const testFile of testFiles) {
    for (const flags of testFile.matrix) {
      if (
        testFile.exclude?.some((x) => areAllElementsOfAIncludedInB(x, flags)) ||
        // Manually added --filter=!... If multiple are present (exclude), and only one is found (flags), it will still pass
        (exclude && exclude.length > 0 && exclude.some((element) => flags.includes(element)))
      ) {
        continue;
      }
      if (filter && filter.length > 0 && !areAllElementsOfAIncludedInB(filter, flags)) {
        continue;
      }

      const hash = JSON.stringify([...new Set(flags)]);

      if (matrices.has(hash)) {
        matrices.get(hash)!.testFiles.push(testFile.filepath);
      } else {
        matrices.set(hash, {
          testFiles: [testFile.filepath],
          flags,
        });
      }
    }
  }

  console.log(`Testing ${matrices.size} combinations`);

  if (command === "workflow-write") {
    const doc = parseDocument(await readFile("../../.github/workflows/tests-entry.yml", "utf-8"));

    const nodeDestination = new YAMLSeq();
    const nodeInclude = new YAMLSeq();

    for (const matrix of matrices.values()) {
      const destination = matrix.flags.length > 0 ? matrix.flags.join("--") : "empty";
      const flags = matrix.flags.length > 0 ? matrix.flags.map((f) => `--${f}`).join(" ") : "empty";
      const testFiles = matrix.testFiles.map((f) => basename(f)).join(",");

      nodeDestination.add(destination);
      const incl = new YAMLMap<string, string>();
      incl.add({ key: "destination", value: destination });
      incl.add({ key: "flags", value: flags });
      incl.add({ key: "test-files", value: testFiles });
      nodeInclude.add(incl);
    }

    // Hard limit is at 256, but we have other jobs running outside of this matrix
    if (nodeDestination.items.length >= 240) {
      throw new Error("Matrix size exceeded");
    }

    doc.setIn(["jobs", "tests-ubuntu", "strategy", "matrix", "destination"], nodeDestination);
    doc.setIn(["jobs", "tests-ubuntu", "strategy", "matrix", "include"], nodeInclude);

    await writeFile("../../.github/workflows/tests-entry.yml", String(doc));

    return;
  }

  await initTmpDir(context);
  const onlyBuiltDependencies = new Set<string>();
  const pnpmRebuildProjectDirs: string[] = [];

  // for all matrices
  for (const { testFiles, flags } of matrices.values()) {
    promises.push(
      limit(async () => {
        const projectDir = await execLocalBati(context, flags);
        const filesP = testFiles.map((f) => copyFile(f, join(projectDir, basename(f))));
        const packageJson = await updatePackageJson(projectDir, flags);
        await Promise.all([
          ...filesP,
          updateTsconfig(projectDir),
          updateVitestConfig(projectDir),
          createBatiConfig(projectDir, flags),
          createKnipConfig(projectDir, flags, packageJson.scripts),
        ]);
        const localBuildDeps = await extractPnpmOnlyBuiltDependencies(projectDir, onlyBuiltDependencies);
        if (localBuildDeps?.includes("better-sqlite3")) {
          pnpmRebuildProjectDirs.push(projectDir);
        }
      }),
    );
  }

  await spinner("Generating test repositories...", () => Promise.all(promises));

  await createWorkspacePackageJson(context);

  // create monorepo config (pnpm only)
  if (npmCli === "pnpm") {
    await createPnpmWorkspaceYaml(context, onlyBuiltDependencies);
  }

  // create .gitignore file, used by turborepo cache hash computation
  await createGitIgnore(context);

  // create turbo config
  await createTurboConfig(context);

  // pnpm/bun link in @batijs/tests-utils so that it can be used inside /tmt/bati/*
  await linkTestUtils();

  // pnpm/bun install
  await spinner("Installing dependencies...", () => packageManagerInstall(context));

  // better-sqlite3 needs to be rebuilt sometimes
  if (npmCli === "pnpm") {
    await pnpmRebuild(pnpmRebuildProjectDirs);
  }

  // exec turbo run test lint build
  await execTurborepo(context, args);
}

const argv = process.argv.slice(2);
const args = mri<CliOptions>(argv);

// init context
const context: GlobalContext = { tmpdir: "", localRepository: false };

try {
  context.localRepository = await isVerdaccioRunning();
  await main(context, args);
} finally {
  if (context.tmpdir && !args.keep) {
    // Delete all tmp dirs
    // We keep this folder on CI because it's cleared automatically, and because we want to upload the json summaries
    // which are generated in `${context.tmpdir}/.turbo/runs`
    await spinner("Cleaning temporary folder...", () =>
      rm(context.tmpdir, { recursive: true, force: true, maxRetries: 2 }),
    );
  }
}
