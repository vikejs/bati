import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  if (props.meta.BATI.hasD1) {
    // D1 uses kysely-d1 dialect
    return packageJson.addDependencies(["kysely", "kysely-d1"]);
  }

  const hasPostgres = props.meta.BATI.has("postgres");

  return packageJson
    .setScript("kysely:migrate", {
      value: "tsx ./database/kysely/migrate.ts",
      precedence: 20,
    })
    .addDevDependencies(["@types/better-sqlite3"], !hasPostgres)
    .addDevDependencies(["tsx"], ["kysely:migrate"])
    .addDependencies(["dotenv", "kysely"])
    .addDependencies(["better-sqlite3"], !hasPostgres)
    .addDependencies(["postgres", "kysely-postgres-js"], hasPostgres);
}
