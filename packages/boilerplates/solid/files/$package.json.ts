import { importSharedJsonFile } from "../src/utils.js";

export default async function getPackageJson() {
  const packageJson = await importSharedJsonFile(import.meta);

  packageJson.devDependencies = {
    typescript: "^5.0.0",
  };
  packageJson.dependencies = {
    "cross-fetch": "^3.0.0",
    "node-fetch": "^3.0.0",
    "solid-js": "^1.7.0",
    solide: "latest",
  };

  return packageJson;
}
