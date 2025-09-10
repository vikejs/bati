import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return (
    packageJson
      .setScript("dev", {
        value: "vike dev",
        precedence: 20,
        warnIfReplaced: true,
      })
      .setScript("build", {
        value: "vike build",
        precedence: 20,
        warnIfReplaced: true,
      })
      .setScript("prod", {
        value: "vike build && cross-env NODE_ENV=production node ./dist/server/index.mjs",
        precedence: 20,
      })
      .addDependencies(["vike-photon"])
      // FIXME if another boilerplates has the same condition with higher prio, it's still removed
      .addDependencies(["cross-env"], ["prod"])
  );
}
