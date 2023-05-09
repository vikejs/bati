import { addDependency, loadAsJson, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["tailwindcss", "postcss", "autoprefixer"],
  });
}
