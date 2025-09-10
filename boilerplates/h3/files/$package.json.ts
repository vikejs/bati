import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDependencies(["@hattip/polyfills", "h3", "vike", "vite", "@photonjs/h3", "@universal-middleware/core"])
    .addDependencies(["@auth/core"], props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0"))
    .addDependencies(["dotenv"], props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase);
}
