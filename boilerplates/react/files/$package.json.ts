import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["vite", "@vitejs/plugin-react", "@types/react", "@types/react-dom"])
    .addDependencies(["react", "react-dom", "vike", "vike-react"]);
}
