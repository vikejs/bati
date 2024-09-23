import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    dev: {
      value: "tsx ./express-entry.ts",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "vite build",
      precedence: 1,
      warnIfReplaced: true,
    },
    preview: {
      value: "cross-env NODE_ENV=production tsx ./express-entry.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/express"],
    dependencies: [
      "@universal-middleware/express",
      "cross-env",
      "express",
      "tsx",
      "vite",
      "vike",
      ...(props.meta.BATI.has("auth0") || props.meta.BATI.hasDatabase ? (["dotenv"] as const) : []),
    ],
  });
}
