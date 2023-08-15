import { addDependency, loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["vite"],
    dependencies: ["cross-fetch", "solid-js", "vike-solid", "vite-plugin-ssr"],
  });
}
