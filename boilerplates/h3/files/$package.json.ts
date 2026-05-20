import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["@types/node"])
    .addDependencies(["h3", "vike", "vite", "@vikejs/h3", "@universal-middleware/core"])
    .addDependencies(["@auth/core"], props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0"))
    .addDependencies(
      ["dotenv"],
      (props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase) && !props.meta.BATI.has("cloudflare"),
    );
}
