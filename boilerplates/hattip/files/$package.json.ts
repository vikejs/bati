import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return (
    packageJson
      .setScript("dev", {
        value: "hattip serve ./hattip-entry.ts --client",
        precedence: 20,
        warnIfReplaced: true,
      })
      .setScript("build", {
        value: "cross-env NODE_ENV=production vike build",
        precedence: 20,
        warnIfReplaced: true,
      })
      // Not compatible with hattip
      .removeScript("preview")
      .addDevDependencies(["@hattip/vite", "@hattip/adapter-node"])
      .addDependencies(["@hattip/core", "@hattip/router", "hattip", "vite", "vike", "@universal-middleware/hattip"])
      .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase)
      .addDependencies(["@hattip/adapter-vercel-edge"], props.meta.BATI.has("vercel"))
      .addDependencies(["@hattip/adapter-aws-lambda", "@hattip/static", "@hattip/walk"], props.meta.BATI.has("aws"))
      .addDevDependencies(["@types/aws-lambda"], props.meta.BATI.has("aws"))
      .addDevDependencies(["cross-env"], ["build"])
  );
}
