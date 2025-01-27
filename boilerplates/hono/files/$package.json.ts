import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("dev", {
      value: "vike dev",
      precedence: 20,
      warnIfReplaced: true,
    })
    .setScript("build", {
      value: "vike build",
      precedence: 1,
      warnIfReplaced: true,
    })
    .setScript("preview", {
      value: "cross-env NODE_ENV=production tsx ./hono-entry.node.ts",
      precedence: 20,
    })
    .addDevDependencies(["@hono/vite-dev-server", "@types/node"])
    .addDevDependencies(["@types/aws-lambda"], props.meta.BATI.has("aws"))
    .addDependencies(["@hono/node-server", "@universal-middleware/hono", "hono", "vite", "vike"])
    .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase)
    .addDevDependencies(["tsx", "cross-env"], ["preview"]);
}
