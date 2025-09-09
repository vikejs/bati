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
      value: "cross-env NODE_ENV=production tsx ./h3-entry.ts",
      precedence: 20,
    })
    .addDependencies(["@hattip/polyfills", "h3", "vike", "vite", "@photonjs/h3", "@universal-middleware/core"])
    .addDependencies(["@auth/core"], props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0"))
    .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase)
    .addDevDependencies(["cross-env"], ["preview"]);
}
