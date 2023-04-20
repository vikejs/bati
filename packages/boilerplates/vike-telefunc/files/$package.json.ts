import { loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.dependencies = {
    ...packageJson.dependencies,
    telefunc: "^0.1.52",
  };

  return packageJson;
}
