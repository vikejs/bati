import { dockerfile, dockerPackageManager, packageManager, type TransformerProps } from "@batijs/core";
import { serverEnvDefaults } from "../env";

export default async function getDockerfile(props: TransformerProps): Promise<string> {
  const { meta } = props;
  let pm = packageManager();

  // better-sqlite3 has no Bun prebuild yet (oven-sh/bun#4290) — build it with node.
  const deps = Object.keys({ ...props.packageJson.dependencies, ...props.packageJson.devDependencies });
  if (pm.name === "bun" && deps.includes("better-sqlite3")) {
    pm = { name: "npm", run: "npm run", exec: "npx" };
  }

  const nodeCli = pm.name === "bun" ? "bun" : "node";
  const run = pm.run;
  // e2e apps carry no per-app lockfile (only a workspace one Docker can't see), so
  // they install loosely; real users install against their committed lockfile.
  const config = dockerPackageManager(pm.name, { frozenLockfile: !meta.BATI_TEST });

  // Commands run at container startup, before the server, when a database needs migrating.
  // Each ORM owns its migration; the raw-client engines (sqlite/postgres) run their own
  // schema script, and only when no ORM is selected (Prisma is self-managed too).
  const startupMigrations: string[] = [];
  if (meta.BATI.has("drizzle")) startupMigrations.push(`${run} drizzle:migrate`);
  if (meta.BATI.has("kysely")) startupMigrations.push(`${nodeCli} ./dist/server/migrate.mjs`);
  if (meta.BATI.has("sqlite") && !meta.BATI.hasOrm) startupMigrations.push(`${run} sqlite:migrate`);
  if (meta.BATI.has("postgres") && !meta.BATI.hasOrm) startupMigrations.push(`${run} postgres:migrate`);

  // The raw source each selected feature needs in the runner (migration scripts, configs, the
  // shared env loader). Features declare these via `deploy` in their bati.config; we copy them
  // from `deps-dev`, the superset stage holding all source plus install/generate artifacts.
  const deployFiles = props.deploy;

  // Run migrations before the server when present; otherwise launch it directly.
  const startCmd =
    startupMigrations.length > 0
      ? ["sh", "-c", [...startupMigrations, `${nodeCli} ./dist/server/index.mjs`].join(" && ")]
      : [nodeCli, "./dist/server/index.mjs"];

  // Files that participate in dependency installation.
  const installSources = ["package.json", ...config.lockfiles];

  const df = dockerfile()
    // ── deps-dev: all dependencies (devDeps + deps) for build & migrations ───
    .from(config.image, { as: "deps-dev", comment: "install all dependencies (devDeps + deps) for build & migrations" })
    .workdir("/app")
    .when(config.corepack, (b) => b.run("corepack enable"))
    .copy(["."], ".")
    .run(config.install)
    .when(meta.BATI.has("drizzle"), (b) =>
      b.env({ DATABASE_URL: "/app/database/sqlite.db" }).run(`${run} drizzle:generate`),
    )

    // ── deps-prod: production dependencies only ──────────────────────────────
    .from(config.image, { as: "deps-prod", comment: "install production-only dependencies for the runtime image" })
    .workdir("/app")
    .when(config.corepack, (b) => b.run("corepack enable"))
    .copy(installSources, "./")
    .run(config.installProd)

    // ── builder: build the application using deps-dev ────────────────────────
    .from(config.image, { as: "builder", comment: "build the application" })
    .workdir("/app")
    .when(config.corepack, (b) => b.run("corepack enable"))
    .copy(["/app/node_modules"], "./node_modules", { from: "deps-dev" })
    .copy(["."], ".")
    .run(`${run} build`)

    // ── runner: production runtime image ─────────────────────────────────────
    .from(config.image, { as: "runner", comment: "production runtime image" })
    .workdir("/app")
    .env({ NODE_ENV: "production", PORT: "3000" })
    // Add environment variables from the env registry
    .pipe((b) => {
      for (const group of serverEnvDefaults(props.env)) {
        b.env(group.vars, { comment: group.comment });
      }
    })
    .when(config.corepack, (b) => b.run("corepack enable"))
    .copy(installSources, "./")
    .copy(["/app/node_modules"], "./node_modules", { from: "deps-prod" })
    .copy(["/app/dist"], "./dist", { from: "builder" })
    .pipe((b) => {
      for (const file of deployFiles) b.copy([`/app/${file}`], `./${file}`, { from: "deps-dev" });
    })
    .expose(3000)
    .cmd(startCmd);

  return `${df.build()}\n`;
}
