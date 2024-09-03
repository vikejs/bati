import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    dependencies: ["@ts-rest/core", "@ts-rest/serverless", "@universal-middleware/core"],
    devDependencies: ["zod"],
  });

  return packageJson;
}
