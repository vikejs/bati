import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  const shouldIgnoreGitignore = props.meta.BATI_IS_CI || props.meta.BATI_SKIP_GIT;
  const lintCommand = shouldIgnoreGitignore
    ? "oxlint --type-aware --ignore-path .gitignore ."
    : "oxlint --type-aware .";

  return packageJson
    .setScript("lint", {
      value: lintCommand,
      precedence: 0,
    })
    .addDevDependencies(["oxlint", "oxlint-tsgolint"]);
}
