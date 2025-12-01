import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("lint", {
      value: "oxlint --type-aware --ignore-path .gitignore .",
      precedence: 0,
    })
    .addDevDependencies(["oxlint", "oxlint-tsgolint"]);
}
