import { loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.dependencies = {
    ...packageJson.dependencies,
    express: "^4.18.2",
    "@hattip/adapter-node": "^0.0.33",
    "@hattip/router": "^0.0.33",
    hattip: "^0.0.33",
  };

  return packageJson;
}
