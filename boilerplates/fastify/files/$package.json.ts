import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("dev", {
      value: "tsx ./fastify-entry.ts",
      precedence: 20,
      warnIfReplaced: true,
    })
    .setScript("build", {
      value: "vike build",
      precedence: 1,
      warnIfReplaced: true,
    })
    .setScript("preview", {
      value: "cross-env NODE_ENV=production tsx ./fastify-entry.ts",
      precedence: 20,
    })
    .addDevDependencies(["@types/node"])
    .addDependencies(["@fastify/middie", "@fastify/static", "@universal-middleware/fastify", "fastify", "vike", "vite"])
    .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase)
    .addDevDependencies(["tsx"], ["dev", "preview"])
    .addDevDependencies(["cross-env"], ["preview"]);
}
