import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    dependencies: ["@ts-rest/core", "@ts-rest/serverless"],
  });

  // 2024-07-05: ts-rest not compatible with TS 5.5 yet at the moment of writing
  packageJson.devDependencies.typescript = "~5.4.5";

  return packageJson;
}
