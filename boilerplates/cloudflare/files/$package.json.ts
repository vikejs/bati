import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("preview:wrangler", {
      value: "wrangler pages dev",
      precedence: 40,
      warnIfReplaced: true,
    })
    .setScript("preview", {
      value: "run-s build preview:wrangler",
      precedence: 40,
      warnIfReplaced: true,
    })
    .setScript("deploy:wrangler", {
      value: "wrangler pages deploy",
      precedence: 40,
      warnIfReplaced: true,
    })
    .setScript("deploy", {
      value: props.meta.BATI.hasD1 ? "run-s build d1:deploy deploy:wrangler" : "run-s build deploy:wrangler",
      precedence: 40,
      warnIfReplaced: true,
    })
    .addDevDependencies(["@cloudflare/workers-types"])
    .addDependencies(["vike-cloudflare"])
    .addDevDependencies(["wrangler"], ["preview:wrangler", "deploy:wrangler", "preview", "deploy"])
    .addDevDependencies(["npm-run-all2"], ["preview", "deploy"]);
}
