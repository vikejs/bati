import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    dev: {
      value: "vite",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "vite build",
      precedence: 1,
      warnIfReplaced: true,
    },
    preview: {
      value: "NODE_ENV=production tsx ./hono-entry.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@hono/vite-dev-server", "@types/node"],
    dependencies: [
      "@hono/node-server",
      "hono",
      "tsx",
      "vite",
      "vike",
      ...(props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0") ? (["@auth/core"] as const) : []),
    ],
  });
}
