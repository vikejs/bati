import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["vite", "@types/react", "@types/react-dom"],
    dependencies: ["@vitejs/plugin-react", "react", "react-dom", "vike", "vike-react"],
  });
}
