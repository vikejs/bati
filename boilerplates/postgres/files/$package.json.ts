import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("postgres:migrate", {
      value: `tsx ./database/postgres/schema/all.ts`,
      precedence: 1,
    })
    .addDependencies(["postgres", "dotenv"])
    .addDevDependencies(["tsx"], ["postgres:migrate"]);
}
