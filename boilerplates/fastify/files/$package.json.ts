import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["@types/node", "vite"])
    .addDependencies(["@vikejs/fastify", "fastify", "fastify-raw-body", "vike"]);
}
