import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["zod"])
    .addDependencies(["@ts-rest/core", "@ts-rest/serverless", "@universal-middleware/core"]);
}
