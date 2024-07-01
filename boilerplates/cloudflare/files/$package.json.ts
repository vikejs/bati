import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    "preview:wrangler": {
      value: "wrangler pages dev",
      precedence: 20,
      warnIfReplaced: true,
    },
    preview: {
      value: "run-s build preview:wrangler",
      precedence: 20,
      warnIfReplaced: true,
    },
    "deploy:wrangler": {
      value: "wrangler pages deploy",
      precedence: 20,
      warnIfReplaced: true,
    },
    deploy: {
      value: "run-s build deploy:wrangler",
      precedence: 20,
      warnIfReplaced: true,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["wrangler", "npm-run-all2"],
    dependencies: [
      "vike-cloudflare",
      ...(props.meta.BATI.has("hattip") ? (["@hattip/adapter-cloudflare-workers"] as const) : []),
    ],
  });
}
