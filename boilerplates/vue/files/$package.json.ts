import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["vite"])
    .addDependencies(["@vitejs/plugin-vue", "vike-vue", "vike", "vue"])
    .addDependencies(["vue-gtag"], props.meta.BATI.has("google-analytics"));
}
