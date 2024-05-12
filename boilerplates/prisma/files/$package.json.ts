import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  packageJson.scripts["prisma:studio"] = "prisma studio";
  packageJson.scripts["prisma:generate"] = "prisma generate";

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["prisma"],
    dependencies: ["@prisma/client"],
  });
}
