import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("edgedb:generate-queries", {
      value: "@edgedb/generate queries",
      precedence: 0,
    })
    .setScript("edgedb:generate-edgeql-js", {
      value: "@edgedb/generate edgeql-js",
      precedence: 0,
    })
    .addDevDependencies(["@edgedb/generate"])
    .addDependencies(["edgedb"]);
}
