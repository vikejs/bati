import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  // TODO/copilot: add `--ignore-path .gitignore` only if CI or `--skip-git`, see https://github.com/vikejs/bati/pull/636#discussion_r2577191441
  return packageJson
    .setScript("lint", {
      value: "oxlint --type-aware --ignore-path .gitignore .",
      precedence: 0,
    })
    .addDevDependencies(["oxlint", "oxlint-tsgolint"]);
}
