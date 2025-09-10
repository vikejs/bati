import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["@types/node"])
    .addDevDependencies(["@types/aws-lambda", "vike-photon"], props.meta.BATI.has("aws"))
    .addDependencies(["@photonjs/hono", "hono", "vite", "vike"])
    .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase);
}
