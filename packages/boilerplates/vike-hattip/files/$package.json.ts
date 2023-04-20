import { loadJsonFile } from "../src/utils.js";

export default async function getPackageJson(currentContent: (() => string | Promise<string>) | undefined) {
  const packageJson = await loadJsonFile(currentContent);

  packageJson.dependencies = {
    ...packageJson.dependencies,
    express: "^4.18.2",
    "@hattip/adapter-node": "^0.0.33",
    "@hattip/router": "^0.0.33",
    hattip: "^0.0.33",
  };

  return packageJson;
}
