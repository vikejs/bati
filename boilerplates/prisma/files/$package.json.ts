import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("prisma:studio", {
      value: "prisma studio",
      precedence: 1,
    })
    .setScript("prisma:generate", {
      value: "prisma generate",
      precedence: 1,
    })
    .addDevDependencies(["prisma"])
    .addDependencies(["@prisma/client"]);
}
