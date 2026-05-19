import { packageManager, type TransformerProps } from "@batijs/core";

export default async function getDockerfile(props: TransformerProps): Promise<string> {
  const { meta } = props;
  const pm = packageManager();

  let installCmd: string;
  let installProdCmd: string;
  let lockfile: string;
  let corepackLine: string;

  switch (pm.name) {
    case "pnpm":
      corepackLine = "RUN corepack enable";
      installCmd = "pnpm install --frozen-lockfile";
      installProdCmd = "pnpm install --prod --frozen-lockfile";
      lockfile = "pnpm-lock.yaml";
      break;
    case "yarn":
      corepackLine = "RUN corepack enable";
      installCmd = "yarn install --frozen-lockfile";
      installProdCmd = "yarn install --frozen-lockfile --production";
      lockfile = "yarn.lock";
      break;
    case "bun":
      corepackLine = "";
      installCmd = "bun install --frozen-lockfile";
      installProdCmd = "bun install --production --frozen-lockfile";
      lockfile = "bun.lockb";
      break;
    default: // npm
      corepackLine = "";
      installCmd = "npm ci";
      installProdCmd = "npm ci --omit=dev";
      lockfile = "package-lock.json";
      break;
  }

  const run = pm.run;

  // Build-time commands (run in builder stage, devDeps available)
  const builderCommands: string[] = [];
  if (meta.BATI.has("drizzle") && !meta.BATI.hasD1) {
    builderCommands.push(`RUN ${run} drizzle:generate`);
  }

  // Startup migration commands (run at container startup)
  const startupMigrations: string[] = [];
  if (meta.BATI.has("sqlite") && !meta.BATI.hasD1) {
    startupMigrations.push(`${run} sqlite:migrate`);
  }
  if (meta.BATI.has("drizzle") && !meta.BATI.hasD1) {
    startupMigrations.push(`${run} drizzle:migrate`);
  }
  if (meta.BATI.has("kysely") && !meta.BATI.hasD1) {
    startupMigrations.push(`${run} kysely:migrate`);
  }

  const hasMigrations = startupMigrations.length > 0;
  // Migration tools (tsx, drizzle-kit) are devDeps — install all deps in runner when needed
  const runnerInstallCmd = hasMigrations ? installCmd : installProdCmd;

  // Source files required by migration scripts in the runner stage
  const migrationCopies: string[] = [];
  if (meta.BATI.has("sqlite") && !meta.BATI.hasD1) {
    migrationCopies.push("COPY --from=builder /app/database/sqlite ./database/sqlite");
  }
  if (meta.BATI.has("drizzle") && !meta.BATI.hasD1) {
    migrationCopies.push("COPY --from=builder /app/database/migrations ./database/migrations");
    migrationCopies.push("COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts");
  }
  if (meta.BATI.has("kysely") && !meta.BATI.hasD1) {
    migrationCopies.push("COPY --from=builder /app/database/kysely ./database/kysely");
  }

  // ── Builder stage ──────────────────────────────────────────────
  const builderLines: string[] = ["FROM node:20-alpine AS builder", "WORKDIR /app", ""];

  if (corepackLine) {
    builderLines.push(corepackLine, "");
  }

  builderLines.push(`COPY package.json ${lockfile} ./`, `RUN ${installCmd}`, "", "COPY . .");

  for (const cmd of builderCommands) {
    builderLines.push(cmd);
  }

  builderLines.push(`RUN ${run} build`);

  // ── Runner stage ───────────────────────────────────────────────
  const runnerLines: string[] = [
    "",
    "",
    "FROM node:20-alpine AS runner",
    "WORKDIR /app",
    "",
    "ENV NODE_ENV=production",
    "ENV PORT=3000",
    "",
  ];

  if (corepackLine) {
    runnerLines.push(corepackLine, "");
  }

  runnerLines.push(`COPY package.json ${lockfile} ./`, `RUN ${runnerInstallCmd}`, "");

  runnerLines.push("COPY --from=builder /app/dist ./dist");

  for (const copy of migrationCopies) {
    runnerLines.push(copy);
  }

  runnerLines.push("", "EXPOSE 3000", "");

  // CMD
  if (hasMigrations) {
    const cmd = [...startupMigrations, "node ./dist/server/index.mjs"].join(" && ");
    runnerLines.push(`CMD ["sh", "-c", "${cmd}"]`);
  } else {
    runnerLines.push(`CMD ["node", "./dist/server/index.mjs"]`);
  }

  return [...builderLines, ...runnerLines].join("\n") + "\n";
}
