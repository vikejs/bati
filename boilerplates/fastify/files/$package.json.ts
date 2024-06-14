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
      value: "NODE_ENV=production tsx ./fastify-entry.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/node", ...(props.meta.BATI.has("auth0") ? (["@types/express", "dotenv"] as const) : [])],
    dependencies: [
      "@fastify/middie",
      "@fastify/static",
      "@universal-middleware/express",
      "fastify",
      "tsx",
      "vike",
      "vite",
      ...(props.meta.BATI.has("authjs") || props.meta.BATI.has("auth0") ? (["@auth/core", "dotenv"] as const) : []),
      ...(props.meta.BATI.has("ts-rest") ? (["@ts-rest/fastify"] as const) : []),
    ],
  });
}
