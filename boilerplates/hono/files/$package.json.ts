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
      value: "cross-env NODE_ENV=production tsx ./hono-entry.node.ts",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@hono/vite-dev-server", "@types/node", "@types/aws-lambda"],
    dependencies: ["@hono/node-server", "@universal-middleware/hono", "cross-env", "hono", "tsx", "vite", "vike"],
  });
}
