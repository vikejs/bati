import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/better-sqlite3", "@types/cookie"],
    dependencies: [
      "arctic",
      "cookie",
      "lucia",
      ...(props.meta.BATI.has("drizzle")
        ? (["@lucia-auth/adapter-drizzle"] as const)
        : (["better-sqlite3", "@lucia-auth/adapter-sqlite"] as const)),
    ],
  });
}
