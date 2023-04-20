import { loadAsJson } from "@batijs/core";
import type { MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.dependencies = {
    ...packageJson.dependencies,
    "cross-fetch": "^3.0.0",
    "solid-js": "^1.7.0",
    solide: "latest",
  };

  return packageJson;
}
