import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["@types/node", "vite"])
    .addDevDependencies(["@types/aws-lambda"], props.meta.BATI.has("aws"))
    .addDependencies(["@vikejs/hono", "hono", "vike"]);
}
