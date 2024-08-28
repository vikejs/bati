import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  packageJson.scripts["drizzle:generate"] = "drizzle-kit generate";
  packageJson.scripts["drizzle:migrate"] = "drizzle-kit migrate";
  packageJson.scripts["drizzle:studio"] = "drizzle-kit studio";
  packageJson.scripts["drizzle:seed"] = "tsx ./database/drizzle/seed.ts";

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/better-sqlite3", "tsx"],
    dependencies: ["better-sqlite3", "drizzle-kit", "drizzle-orm"],
  });
}
