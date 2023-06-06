import { addDependency, loadAsJson, type MaybeContentGetter } from "@batijs/core";

export default async function getPackageJson(currentContent: MaybeContentGetter) {
  const packageJson = await loadAsJson(currentContent);

  packageJson.scripts["prisma:studio"] = "prisma studio";
  packageJson.scripts["prisma:generate"] = "prisma generate";

  return addDependency(packageJson, await import("../package.json", { assert: { type: "json" } }), {
    devDependencies: ["prisma"],
    dependencies: ["@prisma/client"],
  });
}
