import { addDependency, loadAsJson, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.scripts.dev = "tsx ./express-entry.ts";
  packageJson.scripts.build = "vite build";

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["@types/express"],
    dependencies: [
      "@hattip/adapter-node",
      "express",
      "tsx",
      "vite",
      "vite-plugin-ssr",
      ...(meta.BATI_MODULES?.includes("auth:authjs") ? (["@auth/core", "vike-authjs"] as const) : []),
    ],
  });
}
