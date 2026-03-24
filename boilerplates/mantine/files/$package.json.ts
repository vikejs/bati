import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["postcss", "postcss-preset-mantine", "postcss-simple-vars"])
    .addDependencies(["@mantine/core", "@mantine/hooks"]);
}
