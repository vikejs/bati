import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { cpus, tmpdir } from "node:os";
import { basename, join } from "node:path";
import { dirname } from "node:path/posix";
import { fileURLToPath } from "node:url";
import * as process from "process";
import fg from "fast-glob";
import pLimit from "p-limit";
import packageJson from "./package.json";
import { execa } from "./processUtils.js";
import { bunExists, npmCli } from "./tests/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GlobalContext {
  tmpdir: string;
}

function combinate<O extends (string | string[])[]>(obj: O) {
  let combos: string[][] = [];
  if (obj.length === 0) return [[]];

  for (const val of obj) {
    const values = Array.isArray(val) ? val : [val];
    const all: string[][] = [];
    for (const x of values) {
      if (combos.length === 0) {
        all.push([x]);
      } else {
        for (let j = 0; j < combos.length; j++) {
          all.push([...combos[j], x]);
        }
      }
    }
    combos = all;
  }
  return combos;
}

async function initTmpDir(context: GlobalContext) {
  // turborepo hash seems to include cwd(), so always use the same temp folder
  // context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
  context.tmpdir = join(tmpdir(), "bati");

  await rm(context.tmpdir, { recursive: true, force: true });

  await mkdir(context.tmpdir);
  await mkdir(join(context.tmpdir, "packages"));
}

async function loadTestFileMatrix(filepath: string) {
  const f = await import(filepath);

  // TODO sanity check

  return {
    matrix: combinate(f.matrix),
    filepath,
  };
}

function listTestFiles() {
  return fg(join(__dirname, "tests", "*.spec.ts"));
}

async function execCli(context: GlobalContext, flags: string[]) {
  const digest = flags.join("--") || "empty";

  await execa("node", [join(dirname(__dirname), "cli/dist/index.js"), ...flags.map((f) => `--${f}`), digest], {
    timeout: 5000,
    cwd: join(context.tmpdir, "packages"),
  });

  return join(context.tmpdir, "packages", digest);
}

// init
const context: GlobalContext = { tmpdir: "" };

await initTmpDir(context);

const limit = pLimit(cpus().length);
const promises: Promise<unknown>[] = [];

// load all test files matrices
const testFiles = await Promise.all((await listTestFiles()).map((filepath) => loadTestFileMatrix(filepath)));

// run bati cli for all matrices and copy test file
for (const testFile of testFiles) {
  for (const flags of testFile.matrix) {
    promises.push(
      limit(async () => {
        const projectDir = await execCli(context, flags);
        await Promise.all([
          copyFile(testFile.filepath, join(projectDir, "test.spec.ts")),
          copyFile(join(dirname(testFile.filepath), "utils.ts"), join(projectDir, "utils.ts")),
          (async () => {
            // add vitest and lint script
            const pkgjson = JSON.parse(await readFile(join(projectDir, "package.json"), "utf-8"));
            pkgjson.scripts ??= {};
            pkgjson.name = basename(projectDir);
            pkgjson.scripts.test = "vitest run";
            pkgjson.scripts.lint = "tsc --noEmit";
            pkgjson.devDependencies ??= {};
            // TODO extract as a local package
            pkgjson.devDependencies.vitest = packageJson.devDependencies.vitest;
            pkgjson.devDependencies.execa = packageJson.devDependencies.execa;
            pkgjson.devDependencies.which = packageJson.devDependencies.which;
            pkgjson.devDependencies["get-port"] = packageJson.devDependencies["get-port"];
            pkgjson.devDependencies["node-fetch"] = packageJson.devDependencies["node-fetch"];
            pkgjson.devDependencies["tree-kill"] = packageJson.devDependencies["tree-kill"];
            pkgjson.devDependencies["@types/which"] = packageJson.devDependencies["@types/which"];
            await writeFile(join(projectDir, "package.json"), JSON.stringify(pkgjson, undefined, 2), "utf-8");
          })(),
          (async () => {
            // add tsconfig exlude option
            const tsconfig = JSON.parse(await readFile(join(projectDir, "tsconfig.json"), "utf-8"));
            tsconfig.exclude ??= [];
            // exclude temp vite config files
            tsconfig.exclude.push("*.timestamp-*");
            await writeFile(join(projectDir, "tsconfig.json"), JSON.stringify(tsconfig, undefined, 2), "utf-8");
          })(),
          writeFile(
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
          ),
        ]);
      }),
    );
  }
}

// wait for concurrent cli
await Promise.all(promises);

// create package.json
await writeFile(
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

// create monorepo config  (pnpm only)
if (!bunExists) {
  await writeFile(
    join(context.tmpdir, "pnpm-workspace.yaml"),
    `packages:
  - "packages/*"
`,
    "utf-8",
  );
}

// create turbo config
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

const api = "http://localhost:9999";
const token = "BATI";

await writeFile(
  join(context.tmpdir, ".turbo", "config.json"),
  JSON.stringify({
    teamid: "team_bati",
    apiurl: api,
  }),
  "utf-8",
);

// pnpm/bun install
// we use --prefer-offline in order to hit turborepo cache more often (as there is no bun/pnpm lock file)
await execa(npmCli, ["install", "--prefer-offline"], {
  timeout: 60000,
  cwd: context.tmpdir,
  stdout: process.stdout,
  stderr: process.stderr,
});

await execa(
  npmCli,
  [
    bunExists ? "x" : "exec",
    "turbo",
    "run",
    "test",
    "lint",
    "build",
    `--api="${api}"`,
    `--token="${token}"`,
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

// delete all tmp dirs
await rm(context.tmpdir, { recursive: true, force: true });
