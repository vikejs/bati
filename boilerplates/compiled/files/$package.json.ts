import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["vite-plugin-compiled-react"],
    dependencies: ["@compiled/react"],
  });
}
