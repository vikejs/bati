import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("lint", {
      value: "biome lint --write .",
      precedence: 0,
    })
    .setScript("format", {
      value: "biome format --write .",
      precedence: 0,
    })
    .addDevDependencies(["@biomejs/biome"]);
}
