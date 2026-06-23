// One path for local and CI: aggregate matrix.ts → generate an app per combo → run them all as
// Vitest projects. Subcommands:
//   list                  emit the matrix as JSON for the CI fan-out (sorted by name), then exit
//   all [--flag …]        run every combo, or only those whose flags are a superset of the given ones
//   exact --flag …        run exactly one combo — generated and run even if matrix.ts doesn't list it
//   failed                rerun the combos that failed in the previous run
// `--check=knip,oxlint` narrows a run to those named checks; `--dry-run` prints the selection instead
// of running it. Examples:
//   bun packages/tests/e2e/runner.ts all
//   bun packages/tests/e2e/runner.ts all --react --trpc --check=typecheck,knip
//   bun packages/tests/e2e/runner.ts exact --react --hono --trpc --sqlite --drizzle --eslint --biome --oxlint
//   bun packages/tests/e2e/runner.ts failed
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  auth as authAxis,
  Balancer,
  data as dataAxis,
  db as dbAxis,
  exec,
  isPostgresAvailable,
  npmCli,
  orm as ormAxis,
} from "@batijs/tests-utils";
import { createVitest } from "vitest/node";
import { execLocalBati } from "../src/exec-bati.js";
import { failuresFile, initTmpDir } from "../src/tmp.js";
import type { RunnerContext } from "../src/types.js";
import matrix, { type Kind, type Mode } from "./matrix.js";

// Specs resolve vitest + tests-utils from this package, not the generated apps.
const SPEC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PG_URL = "postgresql://postgres:postgres@localhost:5432/app";

interface Combo {
  flags: string[];
  mode: Mode;
  kind?: Kind; // suite identity; its presence also triggers a smoke pass
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  strict: false,
  options: { "dry-run": { type: "boolean" }, check: { type: "string" } },
});
const command = positionals[0];
const dryRun = values["dry-run"] === true;
// Every other `--flag` is a Bati feature flag. parseArgs keeps them verbatim (`compiled-css`,
// `plausible.io`), unlike parsers that camelCase or nest on dots.
const flags = Object.keys(values).filter((k) => k !== "dry-run" && k !== "check");
const checkList = values.check
  ? String(values.check)
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  : [];
const checks = checkList.length > 0 ? checkList : undefined;

// `list` feeds the CI job-per-combo fan-out: sorted by name so the matrix diffs cleanly between PRs,
// and `flags` is the ready-to-pass `--flag` string the run job hands to `exact`.
if (command === "list") {
  const out = buildCombos()
    .map((c) => ({ name: c.flags.join("--"), flags: c.flags.map((f) => `--${f}`).join(" ") }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

// Every subcommand reduces to the same two levers: which combos, and which tests within them. `all` /
// `exact` pick combos and (with `--check`) a test filter; `failed` replays the previous run's failures.
const { combos: selected, testNames } = resolveRun(command, flags, checks);
if (testNames?.length === 0) {
  console.log("[e2e] nothing matches the selection");
  process.exit(0);
}
// Check names sit at the end of a test's full name (e.g. "… > checks > knip"), so anchor to avoid
// matching unrelated tests like "no biome/oxlint directives".
const testNamePattern = testNames ? `(${testNames.map(escapeRegex).join("|")})$` : undefined;

if (dryRun) {
  for (const c of selected) {
    const tags = [c.kind, c.mode === "dev" ? undefined : c.mode].filter(Boolean).join(", ");
    console.log(`${c.flags.join("--")}${tags ? `  [${tags}]` : ""}`);
  }
  if (testNames) console.log(`[e2e] tests: ${testNames.join(", ")}`);
  console.log(`[e2e] ${selected.length} combo(s)`);
  process.exit(0);
}

console.log(`[e2e] ${selected.length} combo(s): ${selected.map((c) => c.flags.join("+")).join(", ")}`);

const context: RunnerContext = { tmpdir: "" };
await initTmpDir(context);

// Postgres combos reach this container through their own generated `.env` (which defaults to the same
// localhost URL). We must NOT set process.env.DATABASE_URL here: it is inherited by every combo's
// migrate/build/dev child — sqlite ones included — and shared-env's loader won't override an already-set
// var, so better-sqlite3 would get the postgres URL as a file path ("directory does not exist").
const hasPostgres = selected.some((c) => c.flags.includes("postgres"));
if (hasPostgres) await startPostgres();

try {
  const apps: { combo: Combo; appDir: string }[] = [];
  for (const combo of selected) {
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

  const vitest = await createVitest("test", { watch: false, testNamePattern }, { test: { projects } });
  await vitest.start();
  const failures = failedCombos(vitest.state.getFiles(), apps);
  await vitest.close();
  // Record failures so `failed` can replay them — but not when `--check` narrowed the run to a subset,
  // which would forget the checks it didn't run.
  if (checks === undefined) writeFailures(failures);
  process.exitCode = failures.length > 0 ? 1 : 0;
} finally {
  if (hasPostgres) await stopPostgres();
}

// `failed` reruns the combos that failed in the previous run; `all` / `exact` pick combos from the
// matrix. In every case `--check` is the within-combo test filter (none → run every test).
function resolveRun(
  cmd: string | undefined,
  want: string[],
  only?: string[],
): { combos: Combo[]; testNames?: string[] } {
  if (cmd === "failed") {
    const recorded = readFailures();
    if (recorded.length === 0) {
      console.log("[e2e] no recorded failures to rerun");
      process.exit(0);
    }
    return { combos: recorded, testNames: only };
  }
  return { combos: select(cmd, want), testNames: only };
}

// `all` → every combo, or those that are a superset of the requested flags (e.g. `all --react --trpc`
// runs every react+trpc combo). `exact` → the single combo with exactly those flags, synthesized
// (dev mode + inferred kind) when matrix.ts doesn't declare it, so any combination can be run ad hoc.
function select(cmd: string | undefined, want: string[]): Combo[] {
  const all = buildCombos();
  if (cmd === "all") {
    if (want.length === 0) return all;
    const hits = all.filter((c) => want.every((f) => c.flags.includes(f)));
    if (hits.length === 0) fail(`no matrix combo is a superset of: ${want.join(", ")}`);
    return hits;
  }
  if (cmd === "exact") {
    if (want.length === 0) fail("`exact` needs at least one --flag");
    const set = new Set(want);
    const match = all.find((c) => c.flags.length === set.size && c.flags.every((f) => set.has(f)));
    return [match ?? { flags: want, mode: "dev", kind: inferKind(want) }];
  }
  fail(
    `unknown command ${cmd ? `"${cmd}"` : "(none)"}. Usage:\n` +
      `  all [--flag …]   run every combo, or those whose flags are a superset of the given ones\n` +
      `  exact --flag …   run exactly one combo (generated even if not in matrix.ts)\n` +
      `  failed           rerun the combos that failed in the previous run\n` +
      `  list             emit the matrix as JSON for the CI fan-out`,
  );
}

function fail(msg: string): never {
  console.error(`[e2e] ${msg}`);
  process.exit(1);
}

// An off-matrix `exact` combo still needs a kind so the right assertion pass runs (data round-trip /
// auth flows / cloudflare deploy). Infer it from the feature axes the flags touch.
function inferKind(flags: string[]): Kind | undefined {
  const touches = (axis: { values: readonly string[] }) => flags.some((f) => axis.values.includes(f));
  if (touches(authAxis)) return "auth";
  if (touches(dataAxis) || touches(dbAxis) || touches(ormAxis)) return "data";
  if (flags.includes("cloudflare")) return "cloudflare";
  return undefined;
}

interface FailureRecord {
  flags: string[];
  mode: Mode;
  kind?: Kind;
}

function readFailures(): FailureRecord[] {
  try {
    return JSON.parse(readFileSync(failuresFile, "utf8"));
  } catch {
    return []; // absent on the first run
  }
}

function writeFailures(records: FailureRecord[]): void {
  writeFileSync(failuresFile, JSON.stringify(records));
}

// The combos whose spec failed — keyed on the file result, so a failed beforeAll (which Vitest reports
// as a suite failure with its tests skipped, not failed) is caught alongside ordinary test failures.
function failedCombos(
  files: { projectName?: string; name: string; result?: { state?: string } }[],
  apps: { combo: Combo }[],
): FailureRecord[] {
  const comboByName = new Map(apps.map((a) => [a.combo.flags.join("--"), a.combo]));
  const records: FailureRecord[] = [];
  for (const file of files) {
    if (file.result?.state !== "fail") continue;
    const combo = comboByName.get(file.projectName ?? file.name);
    if (combo) records.push({ flags: combo.flags, mode: combo.mode, kind: combo.kind });
  }
  return records;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

async function generateApp(flags: string[]): Promise<string> {
  const appDir = await execLocalBati(context, flags, false);
  await exec(npmCli, ["install", "--prefer-offline"], {
    cwd: appDir,
    timeout: 300_000,
    stdio: ["ignore", "ignore", "inherit"],
  });
  return appDir;
}

// One container for the whole run, mirroring CI's "Start PostgreSQL" step.
async function startPostgres() {
  await stopPostgres();
  await exec(
    "docker",
    [
      "run",
      "-d",
      "--name",
      "bati-pg",
      "-e",
      "POSTGRES_USER=postgres",
      "-e",
      "POSTGRES_PASSWORD=postgres",
      "-e",
      "POSTGRES_DB=app",
      "-p",
      "5432:5432",
      "postgres:18-alpine",
    ],
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
