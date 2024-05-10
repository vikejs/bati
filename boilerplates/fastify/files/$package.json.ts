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
    devDependencies: ["@types/node"],
    dependencies: [
      "@fastify/middie",
      "@fastify/static",
      "fastify",
      "tsx",
      "vike",
      "vite",
      ...(props.meta.BATI.has("authjs")
        ? (["@auth/core", "@fastify/formbody", "@hattip/adapter-node", "vike-authjs"] as const)
        : []),
      ...(props.meta.BATI.has("firebase-auth") ? (["@fastify/cookie"] as const) : []),
    ],
  });
}
