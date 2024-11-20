import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("prepare", {
      value: "panda codegen",
      precedence: 20,
    })
    .addDevDependencies(["@pandacss/dev", "postcss"])
    .addDependencies([]);
}
