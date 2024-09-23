import { addDependency, loadAsJson, removeDependency, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    "preview:wrangler": {
      value: "wrangler pages dev",
      precedence: 40,
      warnIfReplaced: true,
    },
    preview: {
      value: "run-s build preview:wrangler",
      precedence: 40,
      warnIfReplaced: true,
    },
    "deploy:wrangler": {
      value: "wrangler pages deploy",
      precedence: 40,
      warnIfReplaced: true,
    },
    deploy: {
      value: "run-s build deploy:wrangler",
      precedence: 40,
      warnIfReplaced: true,
    },
  });

  addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["wrangler", "npm-run-all2", "@cloudflare/workers-types"],
    dependencies: ["vike-cloudflare"],
  });

  // TODO: find a way to link "scripts" and their dependencies (like "tsx" and "cross-env")
  //       so that when overriding a script, we can auto-detect which dependencies need to be removed
  // addDependency(packageJson, await import("../package.json").then((x) => x.default), {
  //   devDependencies: {
  //     wrangler: {
  //       removeIfScriptsReplaced: ["preview:wrangler", "deploy:wrangler", "preview", "deploy"],
  //     },
  //     "npm-run-all2": {
  //       removeIfScriptsReplaced: ["preview", "deploy"],
  //     },
  //   },
  // });

  if (props.meta.BATI.has("hattip")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      dependencies: ["@hattip/adapter-cloudflare-workers"],
    });
  } else {
    removeDependency(packageJson, "tsx");
    removeDependency(packageJson, "cross-env");
  }

  return packageJson;
}
