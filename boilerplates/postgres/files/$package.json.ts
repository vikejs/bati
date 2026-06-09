import { loadPackageJson, packageManager, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  const bun = packageManager().name === "bun";

  packageJson
    .setScript("postgres:migrate", {
      value: `${bun ? "bun" : "tsx"} ./database/postgres/schema/all.ts`,
      precedence: 1,
    })
    .addDependencies(["postgres"])
    .addDevDependencies(["tsx"], ["postgres:migrate"], !bun);

  return packageJson;
}
