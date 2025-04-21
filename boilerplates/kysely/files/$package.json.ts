import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("kysely:migrate", {
      value: "tsx ./database/kysely/migrate.ts",
      precedence: 20,
    })
    .addDependencies(["dotenv", "better-sqlite3", "kysely"])
    .addDevDependencies(["@types/better-sqlite3", "tsx"]);
}
