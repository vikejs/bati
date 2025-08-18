import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("d1:migrate", {
      value: "wrangler d1 migrations apply YOUR_DATABASE_NAME --local",
      precedence: 0,
    })
    .setScript("d1:deploy", {
      value: "wrangler d1 migrations apply YOUR_DATABASE_NAME --remote",
      precedence: 0,
    });
}
