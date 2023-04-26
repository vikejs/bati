import { addDependency, loadAsJson, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), [
    "express",
    "@hattip/adapter-node",
    "@hattip/router",
    "hattip",
    "vite",
    "vite-plugin-ssr",
    ...(meta.VIKE_MODULES?.includes("auth:authjs") ? (["@auth/core", "vike-authjs"] as const) : []),
  ]);
}
