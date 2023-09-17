import { addDependency, loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  // TODO handle conflicts with hattip / express
  packageJson.scripts.build = "vite build && vite build --ssr";

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    dependencies: ["vite-plugin-vercel", "@vite-plugin-vercel/vike"],
  });
}
