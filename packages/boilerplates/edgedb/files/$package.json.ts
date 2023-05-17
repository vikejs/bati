import { addDependency, loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.scripts["edgedb:generate-queries"] = "@edgedb/generate queries";
  packageJson.scripts["edgedb:generate-edgeql-js"] = "@edgedb/generate edgeql-js";

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["@edgedb/generate"],
    dependencies: ["edgedb"],
  });
}
