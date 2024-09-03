import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  packageJson.scripts["d1:migrate"] = "wrangler d1 migrations apply YOUR_DATABASE_NAME --local";

  return packageJson;
}
