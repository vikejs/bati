// One path for local and CI: aggregate matrix.ts → generate an app per combo → run them all as
// Vitest projects. See `USAGE` below (or `runner.ts --help`) for the commands and options.
import { readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  auth as authAxis,
  Balancer,
  data as dataAxis,
  db as dbAxis,
  exec,
  isDockerAvailable,
  npmCli,
  orm as ormAxis,
} from "@batijs/tests-utils";
import { createVitest } from "vitest/node";
import { execLocalBati } from "../src/exec-bati.js";
import { failuresFile, initTmpDir, removeTmpDir } from "../src/tmp.js";
import type { RunnerContext } from "../src/types.js";
import matrix, { type Kind, type Mode } from "./matrix.js";

// Specs resolve vitest + tests-utils from this package, not the generated apps.
const SPEC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

interface Combo {
  flags: string[];
  mode: Mode;
  kind?: Kind; // suite identity; its presence also triggers a smoke pass
}

const USAGE = `Usage: runner.ts <command> [--flag …] [--check=names] [--dry-run]

Commands:
  list             emit the matrix as JSON for the CI fan-out (sorted by name)
  all [--flag …]   (default) run every combo, or only those whose flags are a superset of the given ones
  exact --flag …   run exactly one combo — generated even if matrix.ts doesn't list it
  failed           rerun the combos that failed in the previous run

Options:
  --check=a,b      run only the named checks (e.g. typecheck,knip); skips the server boot
  --dry-run        print the selection instead of running it
  --keep           keep the generated apps on disk (default: removed when the run ends)
  -h, --help       show this help

Examples:
  runner.ts all --react --trpc --check=typecheck,knip
  runner.ts exact --react --hono --trpc --sqlite --drizzle --eslint --biome --oxlint
  runner.ts failed`;

const options = {
  "dry-run": { type: "boolean" },
  check: { type: "string" },
  keep: { type: "boolean" },
  help: { type: "boolean", short: "h" },
} satisfies Record<string, { type: "boolean" | "string"; short?: string }>;
const { positionals, values } = parseArgs({ allowPositionals: true, strict: false, options });
// Bare invocation (e.g. `bun run test:e2e`) runs the whole matrix; an explicit word picks another command.
const command = positionals[0] ?? "all";
if (values.help) {
  console.log(USAGE);
  process.exit(0);
}
const dryRun = values["dry-run"] === true;
const keep = values.keep === true;
// Every flag that isn't one of the runner's own options is a Bati feature flag. parseArgs keeps them
// verbatim (`compiled-css`, `plausible.io`), unlike parsers that camelCase or nest on dots.
const flags = Object.keys(values).filter((k) => !(k in options));
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
const { combos, testNames } = resolveRun(command, flags, checks);

// Check names sit at the end of a test's full name (e.g. "… > checks > knip"), so anchor to avoid
// matching unrelated tests like "no biome/oxlint directives".
const testNamePattern = testNames ? `(${testNames.map(escapeRegex).join("|")})$` : undefined;

if (dryRun) {
  for (const c of combos) {
    const tags = [c.kind, c.mode === "dev" ? undefined : c.mode].filter(Boolean).join(", ");
    console.log(`${c.flags.join("--")}${tags ? `  [${tags}]` : ""}`);
  }
  if (testNames) console.log(`[e2e] tests: ${testNames.join(", ")}`);
  console.log(`[e2e] ${combos.length} combo(s)`);
  process.exit(0);
}

console.log(`[e2e] ${combos.length} combo(s): ${combos.map((c) => c.flags.join("+")).join(", ")}`);

const context: RunnerContext = { tmpdir: "" };

// Combos whose infra needs Docker (postgres → bati-pg, dokploy → compose) skip their server passes when
// Docker is down locally — via Vitest's skipIf in the spec, so they show as skipped rather than vanish.
// CI always has Docker. Checked once here and handed to every project.
const needsDocker = (c: Combo) => c.flags.includes("postgres") || c.flags.includes("dokploy");
const dockerAvailable = !combos.some(needsDocker) || !!process.env.CI || (await isDockerAvailable());

// Postgres combos reach this container through their own generated `.env` (which defaults to the same
// localhost URL). We must NOT set process.env.DATABASE_URL here: it is inherited by every combo's
// migrate/build/dev child — sqlite ones included — and shared-env's loader won't override an already-set
// var, so better-sqlite3 would get the postgres URL as a file path ("directory does not exist").
const hasPostgres = combos.some((c) => c.flags.includes("postgres"));
// Bring it up alongside app generation; only awaited right before the run, so non-postgres runs never
// wait on docker. The catch defers a docker failure to that `await pgReady`, in order.
const pgReady = hasPostgres && dockerAvailable ? startPostgres() : Promise.resolve();
pgReady.catch(() => {});

await initTmpDir(context);

// As each combo's tests finish, delete its node_modules — the slow, bulky part — overlapping that
// with the rest of the run. The app dir itself is kept: it is a worker's cwd, and deleting a live cwd
// breaks reused workers (macOS). The end-of-run rm then only mops up the light app sources.
const removals: Promise<void>[] = [];
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
      provide: { flags: combo.flags, appDir, mode: combo.mode, kind: combo.kind, dockerAvailable },
      testTimeout: 100_000,
    },
  }));

  const appDirByName = new Map(apps.map((a) => [a.combo.flags.join("--"), a.appDir]));
  const reaper = {
    onTestModuleEnd(module: { project: { name: string } }) {
      const dir = appDirByName.get(module.project.name);
      // best-effort: the end-of-run rm is the guarantee
      if (dir)
        removals.push(rm(join(dir, "node_modules"), { recursive: true, force: true, maxRetries: 2 }).catch(() => {}));
    },
  };
  const reporters = keep ? ["default"] : ["default", reaper];

  const vitest = await createVitest("test", { watch: false, testNamePattern }, { test: { projects, reporters } });
  await pgReady; // ready by the time the first combo boots
  if (hasPostgres && dockerAvailable) await isolatePostgresDatabases(apps);
  await vitest.start();
  const failures = failedCombos(vitest.state.getFiles(), apps);
  // Record failures before teardown so a flaky close (e.g. a dokploy container that won't stop) can't
  // leave the file stale. Skip it when `--check` narrowed the run to a subset of the checks.
  if (checks === undefined) writeFailures(failures);
  process.exitCode = failures.length > 0 ? 1 : 0;
  await vitest.close();
} finally {
  if (hasPostgres && dockerAvailable) await stopPostgres();
  if (keep) {
    console.log(`[e2e] kept generated apps in ${context.tmpdir}`);
  } else {
    await Promise.all(removals); // mostly already deleted during the run
    await removeTmpDir(context); // the light remainder, off the next run's critical path
  }
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
      fail(`no failures recorded to rerun — run \`all\` (or \`exact\`) first.\n  file: ${failuresFile}`);
    }
    // More than half the matrix "failing" is never a real rerun set — it's a stale or cascaded file.
    const total = buildCombos().length;
    if (recorded.length * 2 > total) {
      fail(
        `${recorded.length}/${total} combos recorded as failed — more than half, so aborting: this is almost\n` +
          `certainly a stale or cascaded failures file rather than a genuine rerun set.\n` +
          `  file:  ${failuresFile}\n` +
          `  clear: rm "${failuresFile}"  then re-run \`all\` to record real failures\n` +
          `  recorded: ${recorded.map((c) => c.flags.join("--")).join(", ")}`,
      );
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
  fail(`unknown command ${cmd ? `"${cmd}"` : "(none)"}\n\n${USAGE}`);
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

// A failure record is just a serialized combo (so `failed` can regenerate and rerun it).
function readFailures(): Combo[] {
  try {
    return JSON.parse(readFileSync(failuresFile, "utf8"));
  } catch {
    return []; // absent on the first run
  }
}

function writeFailures(combos: Combo[]): void {
  writeFileSync(failuresFile, JSON.stringify(combos));
}

// The combos whose spec failed — keyed on the file result, so a failed beforeAll (which Vitest reports
// as a suite failure with its tests skipped, not failed) is caught alongside ordinary test failures.
function failedCombos(
  files: { projectName?: string; name: string; result?: { state?: string } }[],
  apps: { combo: Combo }[],
): Combo[] {
  const comboByName = new Map(apps.map((a) => [a.combo.flags.join("--"), a.combo]));
  const failed: Combo[] = [];
  for (const file of files) {
    if (file.result?.state !== "fail") continue;
    const combo = comboByName.get(file.projectName ?? file.name);
    if (combo) failed.push(combo);
  }
  return failed;
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
  const appDir = await execLocalBati(context, flags);
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
    if (await postgresAccepts()) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("[e2e] postgres did not become ready");
}

// Readiness probe via pg_isready over TCP *inside* the container. The image's init phase runs a temp
// server on the unix socket only (no TCP), and Docker's host port-proxy answers a connection before
// postgres is up — so only an in-container TCP probe reliably waits for the real server. Otherwise the
// CREATE DATABASE below races the socket, which briefly vanishes during the temp→real server handoff.
function postgresAccepts(): Promise<boolean> {
  return exec("docker", ["exec", "bati-pg", "pg_isready", "-h", "127.0.0.1", "-U", "postgres"], {
    timeout: 10_000,
    stdio: "ignore",
  }).then(
    () => true,
    () => false,
  );
}

function stopPostgres() {
  return exec("docker", ["rm", "-f", "bati-pg"], { timeout: 30_000, stdio: "ignore" }).catch(() => {});
}

// Every postgres combo shares the one bati-pg container, so give each its own database — otherwise
// their drizzle migrations collide creating the same tables. (CI runs one combo per job, never this.)
async function isolatePostgresDatabases(apps: { combo: Combo; appDir: string }[]) {
  let n = 0;
  for (const { combo, appDir } of apps) {
    if (!combo.flags.includes("postgres")) continue;
    const db = `bati_${n++}`;
    await exec("docker", ["exec", "bati-pg", "psql", "-U", "postgres", "-c", `CREATE DATABASE "${db}"`], {
      timeout: 30_000,
    });
    const envPath = join(appDir, ".env");
    writeFileSync(envPath, readFileSync(envPath, "utf8").replaceAll("localhost:5432/app", `localhost:5432/${db}`));
  }
}
