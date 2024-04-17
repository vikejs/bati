import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  if (props.meta.BATI.has("eslint")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-react"],
    });
  }

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["vite", "@types/react", "@types/react-dom"],
    dependencies: ["@vitejs/plugin-react", "cross-fetch", "react", "react-dom", "vike", "vike-react"],
  });
}
