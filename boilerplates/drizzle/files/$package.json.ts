import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  packageJson.scripts["drizzle:generate"] = "drizzle-kit generate";
  packageJson.scripts["drizzle:migrate"] = props.meta.BATI.hasD1
    ? "wrangler d1 migrations apply YOUR_DATABASE_NAME --local"
    : "drizzle-kit migrate";
  packageJson.scripts["drizzle:studio"] = "drizzle-kit studio";

  if (!props.meta.BATI.hasD1) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["@types/better-sqlite3"],
      dependencies: ["better-sqlite3"],
    });
  }

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["tsx"],
    dependencies: ["drizzle-kit", "drizzle-orm", "dotenv"],
  });
}
