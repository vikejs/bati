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

  // Commands run at container startup, before the server, when a database needs
  // migrating — plus the source files each migration script must find in the runner.
  const startupMigrations: string[] = [];
  const migrationCopies: { sources: string[]; dest: string; from: string }[] = [];
  // Each ORM owns its migration; the raw-client engines (sqlite/postgres) run their
  // own schema script, and only when no ORM is selected (Prisma is self-managed too).
  if (meta.BATI.has("drizzle")) {
    startupMigrations.push(`${run} drizzle:migrate`);
    migrationCopies.push({ sources: ["/app/database/migrations"], dest: "./database/migrations", from: "deps-dev" });
    migrationCopies.push({ sources: ["/app/drizzle.config.ts"], dest: "./drizzle.config.ts", from: "builder" });
  }
  if (meta.BATI.has("kysely")) {
    startupMigrations.push(`${nodeCli} ./dist/server/migrate.mjs`);
    migrationCopies.push({
      sources: ["/app/database/kysely/migrations"],
      dest: "./dist/server/migrations",
      from: "builder",
    });
  }
  if (meta.BATI.has("sqlite") && !meta.BATI.hasOrm) {
    startupMigrations.push(`${run} sqlite:migrate`);
    migrationCopies.push({ sources: ["/app/database/sqlite"], dest: "./database/sqlite", from: "builder" });
  }
  if (meta.BATI.has("postgres") && !meta.BATI.hasOrm) {
    startupMigrations.push(`${run} postgres:migrate`);
    migrationCopies.push({ sources: ["/app/database/postgres"], dest: "./database/postgres", from: "builder" });
  }
  // drizzle-kit (drizzle.config.ts) and the raw-client schema scripts (sqlite/postgres
  // without an ORM) run as raw source in the runner, and each imports the shared env
  // loader (`./server/load`, resolved from the app root). Bundled migrations (kysely)
  // already inline it, so they need nothing extra. Ship the loader source alongside.
  if (meta.BATI.has("drizzle") || ((meta.BATI.has("sqlite") || meta.BATI.has("postgres")) && !meta.BATI.hasOrm)) {
    migrationCopies.push({ sources: ["/app/server/load.ts"], dest: "./server/load.ts", from: "builder" });
  }

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
      for (const { sources, dest, from } of migrationCopies) b.copy(sources, dest, { from });
    })
    .expose(3000)
    .cmd(startCmd);

  return `${df.build()}\n`;
}
