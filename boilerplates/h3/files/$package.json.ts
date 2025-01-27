import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("dev", {
      value: "tsx ./h3-entry.ts",
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
    .addDevDependencies(["@types/serve-static"])
    .addDependencies(["@hattip/polyfills", "h3", "serve-static", "vike", "vite", "@universal-middleware/h3"])
    .addDependencies(["@auth/core"], props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0"))
    .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase)
    .addDevDependencies(["tsx"], ["dev", "preview"])
    .addDevDependencies(["cross-env"], ["preview"]);
}
