import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  if (props.meta.BATI.has("eslint")) {
    setScripts(packageJson, {
      lint: {
        value: "eslint --ext .js,.jsx,.ts,.tsx,.vue .",
        precedence: 20
      }
    });

    addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
      devDependencies: ["eslint-plugin-vue"],
    });
  }

  if (props.meta.BATI.has("google-analytics")) {
    addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
      dependencies: ["vue-gtag"],
    });
  }

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
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
