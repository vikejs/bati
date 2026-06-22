// One path for local and CI: aggregate matrix.ts → generate an app per combo →
// run them all as Vitest projects. Replaces src/index.ts + nx + the .e2e workspace.
//   local:   bun packages/tests/e2e/runner.ts
//   one job: bun packages/tests/e2e/runner.ts --only react,mantine,eslint,biome
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Balancer, exec, isPostgresAvailable, npmCli } from "@batijs/tests-utils";
import { createVitest } from "vitest/node";
import matrix, { type Kind, type Mode } from "./matrix.js";
import { execLocalBati } from "../src/exec-bati.js";
import { initTmpDir } from "../src/tmp.js";
import type { RunnerContext } from "../src/types.js";

// Specs resolve vitest + tests-utils from this package, not the generated apps.
const SPEC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PG_URL = "postgresql://postgres:postgres@localhost:5432/app";

interface Combo {
  flags: string[];
  mode: Mode;
  kind?: Kind; // suite identity; its presence also triggers a smoke pass
}

// `--list` emits the matrix as JSON for the CI job-per-combo fan-out, then exits.
if (process.argv.includes("--list")) {
  process.stdout.write(JSON.stringify(buildCombos().map((c) => ({ flags: c.flags.join(","), name: c.flags.join("--") }))));
  process.exit(0);
}

const combos = selectCombos(buildCombos());
console.log(`[e2e] ${combos.length} combo(s): ${combos.map((c) => c.flags.join("+")).join(", ")}`);

const context: RunnerContext = { tmpdir: "" };
await initTmpDir(context);

const hasPostgres = combos.some((c) => c.flags.includes("postgres"));
if (hasPostgres) {
  await startPostgres();
  process.env.DATABASE_URL = PG_URL;
}

try {
  const apps: { combo: Combo; appDir: string }[] = [];
  for (const combo of combos) {
    console.log(`[e2e] generating ${combo.flags.join("+")}`);
    apps.push({ combo, appDir: await generateApp(combo.flags) });
  }

  const projects = apps.map(({ combo, appDir }) => ({
    test: {
      name: combo.flags.join("--"),
      root: SPEC_ROOT,
      include: ["e2e.spec.ts"],
      provide: { flags: combo.flags, appDir, mode: combo.mode, kind: combo.kind },
      testTimeout: 100_000,
    },
  }));

  const vitest = await createVitest("test", { watch: false }, { test: { projects } });
  await vitest.start();
  const failed = vitest.state.getFiles().some((f) => f.result?.state === "fail");
  await vitest.close();
  process.exitCode = failed ? 1 : 0;
} finally {
  if (hasPostgres) await stopPostgres();
}

// The shared Balancer keeps `.spread()` round-robin global across suites.
function buildCombos(): Combo[] {
  const balancer = new Balancer();
  const seen = new Set<string>();
  const combos: Combo[] = [];
  for (const s of matrix) {
    for (const flags of s.flatten(balancer)) {
      const combo: Combo = { flags, mode: s.runMode ?? "dev", kind: s.suiteKind };
      const key = JSON.stringify([[...flags].sort(), combo.mode, combo.kind ?? ""]);
      if (!seen.has(key)) {
        seen.add(key);
        combos.push(combo);
      }
    }
  }
  return combos;
}

function selectCombos(all: Combo[]): Combo[] {
  const i = process.argv.indexOf("--only");
  if (i === -1) return all;
  const want = new Set(process.argv[i + 1].split(","));
  const match = all.find((c) => c.flags.length === want.size && c.flags.every((f) => want.has(f)));
  if (!match) throw new Error(`--only ${[...want].join(",")} matches no combo in matrix.ts`);
  return [match];
}

async function generateApp(flags: string[]): Promise<string> {
  const appDir = await execLocalBati(context, flags, false);
  await exec(npmCli, ["install", "--prefer-offline"], { cwd: appDir, timeout: 300_000, stdio: ["ignore", "ignore", "inherit"] });
  return appDir;
}

// One container for the whole run, mirroring CI's "Start PostgreSQL" step.
async function startPostgres() {
  await stopPostgres();
  await exec(
    "docker",
    ["run", "-d", "--name", "bati-pg", "-e", "POSTGRES_USER=postgres", "-e", "POSTGRES_PASSWORD=postgres",
     "-e", "POSTGRES_DB=app", "-p", "5432:5432", "postgres:18-alpine"],
    { timeout: 120_000, stdio: ["ignore", "ignore", "inherit"] },
  );
  for (let i = 0; i < 60; i++) {
    if (await isPostgresAvailable(PG_URL)) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("[e2e] postgres did not become ready");
}

function stopPostgres() {
  return exec("docker", ["rm", "-f", "bati-pg"], { timeout: 30_000, stdio: "ignore" }).catch(() => {});
}
