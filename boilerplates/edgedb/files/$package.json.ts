import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  packageJson.scripts["edgedb:generate-queries"] = "@edgedb/generate queries";
  packageJson.scripts["edgedb:generate-edgeql-js"] = "@edgedb/generate edgeql-js";

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@edgedb/generate"],
    dependencies: ["edgedb"],
  });
}
