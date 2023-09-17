import { addDependency, loadAsJson, type MaybeContentGetter, setScripts, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  setScripts(packageJson, {
    build: {
      value: "vite build && vite build --ssr",
      precedence: 10,
      // hattip supersedes vite-plugin-vercel build script without issue
      warnIfReplaced: !meta.BATI_MODULES?.includes("server:hattip"),
    },
  });

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    dependencies: ["vite-plugin-vercel", "@vite-plugin-vercel/vike"],
  });
}
