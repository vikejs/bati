import { addDependency, loadAsJson, type MaybeContentGetter, setScripts, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  setScripts(packageJson, {
    dev: {
      value: "hattip serve ./hattip-entry.ts --client",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "hattip build ./hattip-entry.ts --client",
      precedence: 20,
      warnIfReplaced: true,
    },
  });

  // Not supported yet
  if (packageJson.scripts.preview) {
    delete packageJson.scripts.preview;
  }

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["@hattip/vite", "@hattip/adapter-node"],
    dependencies: [
      "@hattip/router",
      "hattip",
      "vite",
      "vike",
      ...(meta.BATI_MODULES?.includes("auth:authjs") ? (["@auth/core", "vike-authjs"] as const) : []),
    ],
  });
}
