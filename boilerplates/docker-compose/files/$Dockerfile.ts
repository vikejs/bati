import { dockerfile, packageManager, type TransformerProps } from "@batijs/core";

interface PmConfig {
  dockerImage: string;
  corepack: boolean;
  installCmd: string;
  installProdCmd: string;
  lockfiles: string[];
}

function getPmConfig(pmName: string, isTest: boolean): PmConfig {
  // In e2e tests the app dir has no per-app lockfile (only a workspace-level one,
  // which Docker doesn't see), so we install loosely. Real users pin to the lockfile.
  const frozenLockFile = isTest ? "" : " --frozen-lockfile";
  switch (pmName) {
    case "pnpm":
      return {
        dockerImage: "node:24-alpine",
        corepack: true,
        installCmd: `pnpm install${frozenLockFile}}`,
        installProdCmd: `pnpm install${frozenLockFile} --prod}`,
        lockfiles: ["pnpm-lock.yaml*", "pnpm-workspace.yaml*"],
      };
    case "yarn":
      return {
        dockerImage: "node:24-alpine",
        corepack: true,
        installCmd: `yarn install${frozenLockFile}`,
        installProdCmd: `yarn install${frozenLockFile} --production`,
        lockfiles: ["yarn.lock*"],
      };
    case "bun":
      return {
        dockerImage: "oven/bun:1-alpine",
        corepack: false,
        installCmd: `bun install${frozenLockFile}`,
        installProdCmd: `bun install${frozenLockFile} --production`,
        lockfiles: ["bun.lock*"],
      };
    default:
      return {
        dockerImage: "node:24-alpine",
        corepack: false,
        installCmd: isTest ? "npm install" : "npm ci",
        installProdCmd: isTest ? "npm install --omit=dev" : "npm ci --omit=dev",
        lockfiles: ["package-lock.json*"],
      };
  }
}

export default async function getDockerfile(props: TransformerProps): Promise<string> {
  const { meta } = props;
  let pm = packageManager();

  // fix: better-sqlite3 + bun
  const deps = Object.keys({ ...props.packageJson.dependencies, ...props.packageJson.devDependencies });
  if (pm.name === "bun" && deps.includes("better-sqlite3")) {
    // Force using node until https://github.com/oven-sh/bun/issues/4290 is fixed
    pm = {
      name: "npm",
      run: "npm run",
      exec: "npx",
    };
  }

  const nodeCli = pm.name === "bun" ? "bun" : "node";
  const run = pm.run;
  const pmConfig = getPmConfig(pm.name, Boolean(meta.BATI_TEST));

  const devSteps: string[] = [];

  // Build-time commands (run in builder stage; devDeps are available)
  const buildSteps: string[] = [];
  buildSteps.push(`${run} build`);

  // Startup migration commands (run at container startup)
  const startupMigrations: string[] = [];

  // Source files required by migration scripts, copied into the runner.
  const migrationCopies: { sources: string[]; dest: string; from: string }[] = [];
  if (meta.BATI.has("sqlite")) {
    startupMigrations.push(`${run} sqlite:migrate`);
    migrationCopies.push({ sources: ["/app/database/sqlite"], dest: "./database/sqlite", from: "builder" });
  }
  if (meta.BATI.has("drizzle")) {
    devSteps.push(`${run} drizzle:generate`);
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

  const hasMigrations = startupMigrations.length > 0;

  // Exec-form CMD, or shell-form when migrations must run before the server.
  const startCmd: string[] = hasMigrations
    ? ["sh", "-c", [...startupMigrations, `${nodeCli} ./dist/server/index.mjs`].join(" && ")]
    : [nodeCli, "./dist/server/index.mjs"];

  // Files that participate in dependency installation
  const installSources = ["package.json", ...pmConfig.lockfiles];

  const df = dockerfile()
    // ── deps-dev: install all dependencies (devDeps + deps) ─────────────────
    .from(pmConfig.dockerImage, {
      as: "deps-dev",
      comment: "install all dependencies (devDeps + deps) for build & migrations",
    })
    .workdir("/app")
    .when(pmConfig.corepack, (b) => b.run("corepack enable"))
    .copy(["."], ".")
    .run(pmConfig.installCmd)
    .when(meta.BATI.has("drizzle"), (b) => b.env({ DATABASE_URL: "/app/database/sqlite.db" }))
    .pipe((b) => {
      for (const cmd of devSteps) b.run(cmd);
    })

    // ── deps-prod: install production dependencies only ─────────────────────
    .from(pmConfig.dockerImage, {
      as: "deps-prod",
      comment: "install production-only dependencies for the runtime image",
    })
    .workdir("/app")
    .when(pmConfig.corepack, (b) => b.run("corepack enable"))
    .copy(installSources, "./")
    .run(pmConfig.installProdCmd)

    // ── builder: build the application using deps-dev ───────────────────────
    .from(pmConfig.dockerImage, { as: "builder", comment: "build the application" })
    .workdir("/app")
    .when(pmConfig.corepack, (b) => b.run("corepack enable"))
    .copy(["/app/node_modules"], "./node_modules", { from: "deps-dev" })
    .copy(["."], ".")
    .pipe((b) => {
      for (const cmd of buildSteps) b.run(cmd);
    })

    // ── runner: production runtime image ────────────────────────────────────
    .from(pmConfig.dockerImage, { as: "runner", comment: "production runtime image" })
    .workdir("/app")
    .env({ NODE_ENV: "production", PORT: "3000" })
    .when(meta.BATI.has("drizzle"), (b) => b.env({ DATABASE_URL: "/app/database/sqlite.db" }))
    .when(pmConfig.corepack, (b) => b.run("corepack enable"))
    .copy(installSources, "./")
    .copy(["/app/node_modules"], "./node_modules", { from: "deps-prod" })
    .copy(["/app/dist"], "./dist", { from: "builder" })
    .pipe((b) => {
      for (const { sources, dest, from } of migrationCopies) {
        b.copy(sources, dest, { from });
      }
    })
    .expose(3000)
    .cmd(startCmd);

  return `${df.build()}\n`;
}
