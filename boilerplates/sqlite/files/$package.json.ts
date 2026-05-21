import { loadPackageJson, packageManager, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));
  const pm = packageManager();
  const isBun = pm.name === "bun";

  return packageJson
    .setScript("sqlite:migrate", {
      value: `${isBun ? "bun" : "tsx"} ./database/sqlite/schema/all.ts`,
      precedence: 1,
    })
    .addDevDependencies(["@types/better-sqlite3"], !isBun)
    .addDependencies(["better-sqlite3"], !isBun)
    .addDevDependencies(["tsx"], ["sqlite:migrate"], !isBun)
    .addDependencies(["dotenv"]);
}
