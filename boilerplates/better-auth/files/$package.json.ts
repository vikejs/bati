import { loadPackageJson, packageManager, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));
  const { BATI } = props.meta;

  packageJson.addDependencies(["better-auth", "@universal-middleware/core"]);

  if (BATI.has("drizzle")) {
    // Better Auth reuses the app's Drizzle instance; Drizzle owns the schema and its migrate flow
    // (`drizzle:generate` / `drizzle:migrate`) creates Better Auth's tables. No extra deps needed.
    return packageJson;
  }

  if (BATI.hasD1) {
    // Cloudflare D1: Better Auth talks to D1 through Kysely's D1 dialect.
    // D1 tables are created via wrangler migrations (see TODO.md), not the migrate script below.
    return packageJson.addDependencies(["kysely", "kysely-d1"]);
  }

  const hasPostgres = BATI.has("postgres");
  // Bun runs TypeScript directly; Node needs tsx. SQLite stays on tsx even under Bun
  // because the migration loads better-sqlite3, which has no Bun build.
  const bunDirect = packageManager().name === "bun" && hasPostgres;

  return (
    packageJson
      .setScript("better-auth:migrate", {
        value: `${bunDirect ? "bun" : "tsx"} ./database/better-auth/migrate.ts`,
        precedence: 20,
      })
      .addDevDependencies(["tsx"], ["better-auth:migrate"], !bunDirect)
      // postgres.js + Kysely's PostgresJSDialect (same driver as the rest of the app; Bun-friendly).
      .addDependencies(["postgres", "kysely", "kysely-postgres-js"], hasPostgres)
      .addDependencies(["better-sqlite3"], !hasPostgres)
      .addDevDependencies(["@types/better-sqlite3"], !hasPostgres)
  );
}
