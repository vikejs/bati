import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  const ignoreFlag = props.meta.BATI_IS_CI || props.meta.BATI_SKIP_GIT ? "--ignore-path .gitignore " : "";

  return packageJson
    .setScript("lint", {
      value: `oxlint --type-aware ${ignoreFlag}.`,
      precedence: 0,
    })
    .addDevDependencies(["oxlint", "oxlint-tsgolint"]);
}
