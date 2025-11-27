import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .removeScript("prod")
    .setScript("deploy", {
      value: "vike build && wrangler deploy",
      precedence: 25,
      warnIfReplaced: true,
    })
    .addDevDependencies(["wrangler"])
    .addDependencies(["@photonjs/cloudflare"]);
}
