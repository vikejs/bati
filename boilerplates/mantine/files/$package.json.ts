import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["postcss", "postcss-preset-mantine", "postcss-simple-vars"],
    dependencies: ["@mantine/core", "@mantine/hooks"],
  });
}
