import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  if (props.meta.BATI.has("google-analytics")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      dependencies: ["vue-gtag"],
    });
  }

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["vite"],
    dependencies: [
      "@vitejs/plugin-vue",
      "@vue/compiler-sfc",
      "@vue/server-renderer",
      "cross-fetch",
      "unplugin-vue-markdown",
      "vike-vue",
      "vike",
      "vue",
    ],
  });
}
