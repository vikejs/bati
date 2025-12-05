import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  if (props.meta.BATI.hasD1) {
    // D1 uses kysely-d1 dialect
    return packageJson.addDependencies(["kysely", "kysely-d1"]);
  }

  return packageJson
    .setScript("kysely:migrate", {
      value: "tsx ./database/kysely/migrate.ts",
      precedence: 20,
    })
    .addDevDependencies(["@types/better-sqlite3"])
    .addDevDependencies(["tsx"], ["kysely:migrate"])
    .addDependencies(["better-sqlite3", "dotenv", "kysely"]);
}
