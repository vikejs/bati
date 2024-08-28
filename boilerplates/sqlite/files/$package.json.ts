import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  packageJson.scripts["sqlite:migrate"] = "tsx ./database/sqlite/schema/all.ts";

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["dotenv", "@types/better-sqlite3", "tsx"],
    dependencies: ["better-sqlite3"],
  });
}
