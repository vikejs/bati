import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  if (props.meta.BATI_MODULES?.includes("eslint")) {
    addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
      devDependencies: ["eslint-plugin-solid"],
    });
  }

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["vite"],
    dependencies: ["cross-fetch", "solid-js", "vike-solid", "vike"],
  });
}
