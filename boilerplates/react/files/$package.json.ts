import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["vite", "@types/react", "@types/react-dom"])
    .addDependencies(["@vitejs/plugin-react", "react", "react-dom", "vike", "vike-react", "vike-photon"]);
}
