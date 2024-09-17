import { copyFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { cpus, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as process from "process";
import { bunExists, exec, npmCli, zx } from "@batijs/tests-utils";
import dotenv from "dotenv";
import mri from "mri";
import pLimit from "p-limit";
import packageJson from "../package.json";
import { execLocalBati } from "./exec-bati.js";
import { listTestFiles, loadTestFileMatrix } from "./load-test-files.js";
import { initTmpDir } from "./tmp.js";
import type { GlobalContext } from "./types.js";
import * as ci from "@actions/core";
import {
  createBatiConfig,
  createTurboConfig,
  updatePackageJson,
  updateTsconfig,
  updateVitestConfig,
} from "./common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..", "..", "..");

interface CliOptions {
  filter?: string;
  steps?: string;
  force?: boolean;
  summarize?: boolean;
  keep?: boolean;
}

async function getPackageManagerVersion() {
  const process = exec(npmCli, ["--version"], {
    timeout: 5 * 1000, // 5sec
    stdio: "pipe",
  });

  let version = "";

  process.stdout!.on("data", function (data) {
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
      ...(bunExists ? { workspaces: ["packages/*"] } : {}),
      packageManager: `${npmCli}@${version}`,
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

async function createGitIgnore(context: GlobalContext) {
  await copyFile(join(root, ".gitignore"), join(context.tmpdir, ".gitignore"));
}

function linkTestUtils() {
  return exec(npmCli, bunExists ? ["link"] : ["link", "--global"], {
    // pnpm link --global takes some time
    timeout: 60 * 1000,
    cwd: join(__dirname, "..", "..", "tests-utils"),
    stdio: ["ignore", "ignore", "inherit"],
  });
}

async function packageManagerInstall(context: GlobalContext) {
  {
    // we use --prefer-offline in order to hit turborepo cache more often (as there is no bun/pnpm lock file)
    const child = exec(npmCli, ["install", "--prefer-offline"], {
      // really slow on Windows CI
      timeout: 5 * 60 * 1000,
      cwd: context.tmpdir,
      stdio: ["ignore", "ignore", "inherit"],
    });

    await child;
  }

  if (!bunExists) {
    // see https://stackoverflow.com/questions/72032028/can-pnpm-replace-npm-link-yarn-link/72106897#72106897
    const child = exec(npmCli, ["link", "--global", "@batijs/tests-utils"], {
      timeout: 60000,
      cwd: context.tmpdir,
      stdio: ["ignore", "ignore", "inherit"],
    });

    await child;
  }
}
async function execTurborepo(context: GlobalContext, args: mri.Argv<CliOptions>) {
  const steps = args.steps ? args.steps.split(",") : undefined;
  const args_1 = [bunExists ? "x" : "exec", "turbo", "run"];
  const args_2 = ["--no-update-notifier", "--framework-inference", "false", "--env-mode", "loose"];

  const cacheDir = process.env.CI ? false : join(tmpdir(), "bati-cache");
  if (cacheDir) {
    console.log("[turborepo] Using cache dir", cacheDir);
    args_2.push(`--cache-dir`);
    args_2.push(cacheDir);
  }

  if (process.env.CI) {
    // GitHub CI seems to fail more often with default concurrency
    args_2.push("--concurrency");
    args_2.push("3");
  }

  if (args.force) {
    args_2.push("--force");
  }

  if (args.summarize) {
    // Debug cache hits
    args_2.push("--summarize");
  }

  await exec(npmCli, [...args_1, ...(steps ?? ["build", "test", "lint", "typecheck"]), ...args_2], {
    timeout: 35 * 60 * 1000, // 35min
    cwd: context.tmpdir,
  });
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

function arrayIncludes(a: string[], b: string[]) {
  return a.every((element) => b.includes(element));
}

async function spinner<T>(title: string, callback: () => T): Promise<T> {
  if (process.env.CI) {
    return callback();
  }
  return zx.spinner(title, callback);
}

async function main(context: GlobalContext, args: mri.Argv<CliOptions>) {
  const command: string | undefined = args._[0];
  const filter = args.filter ? args.filter.split(",") : undefined;

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
      if (testFile.exclude?.some((x) => arrayIncludes(x, flags))) {
        continue;
      }
      if (filter && !arrayIncludes(filter, flags)) {
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

  if (command === "list") {
    const projects = Array.from(matrices.values()).map((m) => ({
      testFiles: m.testFiles.map((f) => basename(f)),
      flags: m.flags.map((f) => `--${f}`).join(" "),
    }));
    console.log("projects: ", { projects });
    ci.setOutput("test-matrix", { projects });
    return;
  }

  await initTmpDir(context);

  // for all matrices
  for (const { testFiles, flags } of matrices.values()) {
    promises.push(
      limit(async () => {
        const projectDir = await execLocalBati(context, flags);
        const filesP = testFiles.map((f) => copyFile(f, join(projectDir, basename(f))));
        await Promise.all([
          ...filesP,
          updatePackageJson(projectDir),
          updateTsconfig(projectDir),
          updateVitestConfig(projectDir),
          createBatiConfig(projectDir, flags),
        ]);
      }),
    );
  }

  await spinner("Generating test repositories...", () => Promise.all(promises));

  await createWorkspacePackageJson(context);

  // create monorepo config (pnpm only)
  if (!bunExists) {
    await createPnpmWorkspaceYaml(context);
  }

  // create .gitignore file, used by turborepo cache hash computation
  await createGitIgnore(context);

  // create turbo config
  await createTurboConfig(context);

  // pnpm/bun link in @batijs/tests-utils so that it can be used inside /tmt/bati/*
  await linkTestUtils();

  // pnpm/bun install
  await spinner("Installing dependencies...", () => packageManagerInstall(context));

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
