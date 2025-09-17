import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("prod", {
      value: "vike build && wrangler dev ./dist/server/index.js -c ./dist/server/wrangler.json",
      precedence: 25,
      warnIfReplaced: true,
    })
    .setScript("deploy", {
      value: "vike build && wrangler deploy",
      precedence: 25,
      warnIfReplaced: true,
    })
    .addDevDependencies(["@cloudflare/workers-types", "wrangler"])
    .addDependencies(["@photonjs/cloudflare"]);
}
