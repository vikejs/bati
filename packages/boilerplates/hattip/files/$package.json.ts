import { addDependency, loadAsJson, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.scripts.dev = "hattip serve ./hattip-entry.ts --client";
  packageJson.scripts.build = "hattip build ./hattip-entry.ts --client";

  // Not supported yet
  if (packageJson.scripts.preview) {
    delete packageJson.scripts.preview;
  }

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["@hattip/vite"],
    dependencies: [
      "@hattip/router",
      "hattip",
      "vite",
      "vite-plugin-ssr",
      ...(meta.VIKE_MODULES?.includes("auth:authjs") ? (["@auth/core", "vike-authjs"] as const) : []),
    ],
  });
}
