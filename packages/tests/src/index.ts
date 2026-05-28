import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { cpus } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";
import { Balancer, exec, npmCli, zx } from "@batijs/tests-utils";
import dotenv from "dotenv";
import mri from "mri";
import pLimit from "p-limit";

import { Document, parseDocument, YAMLMap, YAMLSeq } from "yaml";
import rootPackageJson from "../../../package.json" with { type: "json" };
import { createE2EWorkspace, createNxConfig, extractPnpmOnlyBuiltDependencies } from "./common.js";
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
        nx: rootPackageJson.devDependencies.nx,
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

// Pack @batijs/tests-utils so the sibling `.e2e/` workspaces can install it as
// a real tarball (file: dependency). The tarball lives in `<app>.e2e/` —
// never in the app dir — so docker build contexts stay clean and no
// `bun link` / `pnpm link` global registration is required.
async function packTestsUtils(): Promise<string> {
  const testsUtilsDir = join(__dirname, "..", "..", "tests-utils");

  const existing = (await readdir(testsUtilsDir)).filter(
    (f) => f.startsWith("batijs-tests-utils-") && f.endsWith(".tgz"),
  );
  await Promise.all(existing.map((f) => rm(join(testsUtilsDir, f))));

  await exec("npm", ["pack", "--quiet"], {
    timeout: 30 * 1000,
    cwd: testsUtilsDir,
    stdio: ["ignore", "ignore", "inherit"],
  });

  const tgzFiles = (await readdir(testsUtilsDir)).filter(
    (f) => f.startsWith("batijs-tests-utils-") && f.endsWith(".tgz"),
  );
  if (tgzFiles.length === 0) {
    throw new Error("packTestsUtils: no .tgz produced by npm pack");
  }
  return join(testsUtilsDir, tgzFiles[0]);
}

async function packageManagerInstall(context: GlobalContext) {
  await exec(npmCli, ["install", "--prefer-offline", ...(npmCli === "bun" ? ["--linker", "isolated"] : [])], {
    // really slow on Windows CI
    timeout: 5 * 60 * 1000,
    cwd: context.tmpdir,
    stdio: ["ignore", "ignore", "inherit"],
  });

  if (npmCli === "bun") {
    // Circumvent https://github.com/aws/aws-cdk/issues/33270
    await writeFile(join(context.tmpdir, "bun.lockb"), "", "utf-8");
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

async function execNx(context: GlobalContext, args: mri.Argv<CliOptions>) {
  if (args.steps) {
    // User-specified target list — single pass across every project.
    await execNxRunMany(context, args.steps);
    return;
  }

  // Two-pass orchestration:
  //   - Build targets run only on app projects (`!*-e2e` excludes the e2e workspaces),
  //     so the app build runs exactly once per matrix.
  //   - Dev targets run only on `*-e2e` workspaces, where the scripts proxy back into
  //     the sibling app via `cd ../<app>`. nx still sequences these correctly because
  //     pass 1 completes before pass 2 starts.
  //
  // The `.e2e/` workspaces ship a `build` script too (so `dependsOn: ["build"]` stays
  // satisfiable for direct `bun run` invocations), but with this split it is never
  // triggered by nx — pass 2 doesn't list `build` as a target.
  await execNxRunMany(context, "generate-types,build", "!*-e2e");
  await execNxRunMany(context, "test,lint:eslint,lint:biome,lint:oxlint,typecheck,knip", "*-e2e");
}

async function execNxRunMany(context: GlobalContext, steps: string, projectsPattern?: string) {
  const cmdArgs = [
    npmCli === "bun" ? "x" : "exec",
    "nx",
    "run-many",
    `--targets=${steps}`,
    "--excludeTaskDependencies",
  ];
  if (projectsPattern) cmdArgs.push(`--projects=${projectsPattern}`);

  await exec(npmCli, cmdArgs, {
    timeout: 35 * 60 * 1000, // 35min
    cwd: context.tmpdir,
    env: {
      NX_DAEMON: "false",
      // CI=true suppresses interactive prompts inside the generated app (e.g.
      // `wrangler types` asking to install Cloudflare skills). NX_TUI is forced
      // so nx doesn't auto-disable its TUI when CI is set.
      CI: "true",
      NX_TUI: process.stdout.isTTY ? "true" : "false",
    },
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

async function main(context: GlobalContext, args: mri.Argv<CliOptions>) {
  const command: string | undefined = args._[0];

  if (command === "workflow-write") {
    // Ensure tests for auth0 are generated even if no env var is defined
    process.env.TEST_AUTH0_CLIENT_ID ??= "TEST";
  }

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

  // One balancer shared across all spec files — gives `.spread()` calls a global
  // round-robin so vue / react / solid each get roughly equal coverage. Sort
  // spec paths so balancer state (and therefore generated combos) are stable
  // across runs.
  const balancer = new Balancer();
  const testFiles = await spinner("Loading all test files matrices...", async () => {
    const paths = (await listTestFiles()).sort();
    const loaded = [];
    for (const filepath of paths) {
      loaded.push(await loadTestFileMatrix(filepath, balancer));
    }
    return loaded;
  });

  for (const testFile of testFiles) {
    for (const flags of testFile.matrix) {
      // Manually added --filter=!... If multiple are present (exclude), and only one is found (flags), it will still pass
      if (exclude && exclude.length > 0 && exclude.some((element) => flags.includes(element))) {
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

  // Every matrix uses a sibling host-only workspace at `<projectDir>.e2e/` —
  // the app dir stays byte-identical to CLI output. The tarball lives in the
  // sibling (never the app), so docker build contexts are pristine and the
  // bun `link:` protocol is sidestepped entirely.
  const packedTestsUtilsTgzPath = await packTestsUtils();
  const tgzFilename = basename(packedTestsUtilsTgzPath);

  for (const { testFiles, flags } of matrices.values()) {
    promises.push(
      limit(async () => {
        const projectDir = await execLocalBati(context, flags);
        const e2eDir = `${projectDir}.e2e`;
        await mkdir(e2eDir);
        await copyFile(packedTestsUtilsTgzPath, join(e2eDir, tgzFilename));
        await Promise.all([
          ...testFiles.map((f) => copyFile(f, join(e2eDir, basename(f)))),
          createE2EWorkspace({
            e2eDir,
            appName: basename(projectDir),
            flags,
            testsUtilsRef: `./${tgzFilename}`,
          }),
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

  // create .gitignore file
  await createGitIgnore(context);

  // create nx config for workspace-level task orchestration
  // Note: nx.json is created AFTER execLocalBati so storybook init cannot detect it
  await createNxConfig(context);

  // pnpm/bun install — every package.json references the packed tests-utils
  // tarball, so no global link registration is required.
  await spinner("Installing dependencies...", () => packageManagerInstall(context));

  // better-sqlite3 needs to be rebuilt sometimes
  if (npmCli === "pnpm") {
    await pnpmRebuild(pnpmRebuildProjectDirs);
  }

  // exec test steps across all generated packages
  await execNx(context, args);
}

const argv = process.argv.slice(2);
const args = mri<CliOptions>(argv);

// init context
const context: GlobalContext = { tmpdir: "", localRepository: false };

try {
  context.localRepository = await isVerdaccioRunning();
  await main(context, args);
} catch (e) {
  console.error(e);
  throw e;
} finally {
  if (context.tmpdir && !args.keep) {
    // Delete all tmp dirs
    // We keep this folder on CI because it's cleared automatically
    await spinner("Cleaning temporary folder...", () =>
      rm(context.tmpdir, { recursive: true, force: true, maxRetries: 2 }),
    );
  }
}
