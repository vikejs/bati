import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const pkgjson = await import("../package.json").then((x) => x.default);
  const packageJson = await loadPackageJson(props, pkgjson);

  return packageJson
    .addDevDependencies(["tailwindcss", "@tailwindcss/vite"])
    .addDevDependencies(["daisyui"], props.meta.BATI.has("daisyui"));
}
