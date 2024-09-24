import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/cookie"],
    dependencies: [
      "arctic",
      "cookie",
      "lucia",
      "@universal-middleware/core",
      "dotenv",
      ...(props.meta.BATI.has("drizzle")
        ? (["@lucia-auth/adapter-drizzle"] as const)
        : (["@lucia-auth/adapter-sqlite"] as const)),
    ],
  });

  if (!props.meta.BATI.hasD1) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["@types/better-sqlite3"],
      dependencies: ["better-sqlite3"],
    });
  }

  return packageJson;
}
