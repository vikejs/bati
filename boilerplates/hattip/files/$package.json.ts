import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    dev: {
      value: "hattip serve ./hattip-entry.ts --client",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "cross-env NODE_ENV=production hattip build ./hattip-entry.ts --target es2022 --client",
      precedence: 20,
      warnIfReplaced: true,
    },
  });

  // Not supported yet
  if (packageJson.scripts.preview) {
    delete packageJson.scripts.preview;
  }

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@hattip/vite", "@hattip/adapter-node"],
    dependencies: [
      "@hattip/core",
      "@hattip/router",
      "cross-env",
      "hattip",
      "vite",
      "vike",
      ...(props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0") ? (["@auth/core", "dotenv"] as const) : []),
      ...(props.meta.BATI.has("vercel") ? (["@hattip/adapter-vercel-edge"] as const) : []),
    ],
  });
}
