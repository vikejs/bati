import { loadJsonFile } from "../src/utils.js";

export default async function getPackageJson(currentContent: (() => string | Promise<string>) | undefined) {
  const packageJson = await loadJsonFile(currentContent);

  packageJson.dependencies = {
    ...packageJson.dependencies,
    telefunc: "^0.1.52",
  };

  return packageJson;
}
