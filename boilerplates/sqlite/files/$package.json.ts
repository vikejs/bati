import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("sqlite:migrate", {
      value: "tsx ./database/sqlite/schema/all.ts",
      precedence: 1,
    })
    .addDevDependencies(["@types/better-sqlite3"])
    .addDevDependencies(["tsx"], ["sqlite:migrate"])
    .addDependencies(["better-sqlite3", "dotenv"]);
}
