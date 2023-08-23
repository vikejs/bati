import { addDependency, loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["vite"],
    dependencies: [
      "@vitejs/plugin-vue",
      "@vue/compiler-sfc",
      "@vue/server-renderer",
      "cross-fetch",
      "unplugin-vue-markdown",
      "vike-vue",
      "vite-plugin-ssr",
      "vue",
    ],
  });
}
