import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  const gitIgnore = props.meta.BATI_IS_CI || props.meta.BATI_SKIP_GIT ? "--ignore-path .gitignore " : "";
  const CWD = ".";
  return packageJson
    .setScript("lint", {
      value: `oxlint --type-aware ${gitIgnore}${CWD}`,
      precedence: 0,
    })
    .addDevDependencies(["oxlint", "oxlint-tsgolint"]);
}
