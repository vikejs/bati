import { addDependency, loadAsJson, type MaybeContentGetter, setScripts, type VikeMeta } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const packageJson = await loadAsJson(currentContent);

  setScripts(packageJson, {
    dev: {
      value: "esno ./express-entry.ts",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "vite build",
      precedence: 1,
      warnIfReplaced: true,
    },
    preview: {
      value: "NODE_ENV=production esno ./express-entry.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["@types/express"],
    dependencies: [
      "@hattip/adapter-node",
      "express",
      "esno",
      "vite",
      "vike",
      ...(meta.BATI_MODULES?.includes("auth:authjs") ? (["@auth/core", "vike-authjs"] as const) : []),
    ],
  });
}
