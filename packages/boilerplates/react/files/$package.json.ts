import { addDependency, loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["vite", "@types/react", "@types/react-dom"],
    dependencies: ["@vitejs/plugin-react", "cross-fetch", "react", "react-dom", "vike", "vike-react"],
  });
}
