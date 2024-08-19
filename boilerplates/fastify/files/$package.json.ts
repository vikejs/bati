import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    dev: {
      value: "tsx ./fastify-entry.ts",
      precedence: 20,
      warnIfReplaced: true,
    },
    build: {
      value: "vite build",
      precedence: 1,
      warnIfReplaced: true,
    },
    preview: {
      value: "cross-env NODE_ENV=production tsx ./fastify-entry.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/node", ...(props.meta.BATI.has("auth0") ? (["@types/express", "dotenv"] as const) : [])],
    dependencies: [
      "@fastify/middie",
      "@fastify/static",
      "@universal-middleware/fastify",
      "cross-env",
      "fastify",
      "tsx",
      "vike",
      "vite",
    ],
  });
}
