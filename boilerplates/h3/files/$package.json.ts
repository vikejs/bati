import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    dev: {
      value: "tsx ./h3-entry.ts",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "vite build",
      precedence: 1,
      warnIfReplaced: true,
    },
    preview: {
      value: "cross-env NODE_ENV=production tsx ./h3-entry.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: [
      "@types/serve-static",
      ...(props.meta.BATI.has("auth0") ? (["@types/express", "dotenv"] as const) : []),
    ],
    dependencies: [
      "@hattip/polyfills",
      "cross-env",
      "h3",
      "serve-static",
      "tsx",
      "vike",
      "vite",
      "@universal-middleware/h3",
      ...(props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0") ? (["@auth/core"] as const) : []),
    ],
  });
}
