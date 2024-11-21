import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDependencies(["arctic", "cookie", "lucia", "@universal-middleware/core", "dotenv"])
    .addDependencies(["@lucia-auth/adapter-drizzle"], props.meta.BATI.has("drizzle"))
    .addDependencies(["@lucia-auth/adapter-sqlite"], !props.meta.BATI.has("drizzle"))
    .addDevDependencies(["@types/better-sqlite3"], !props.meta.BATI.hasD1)
    .addDependencies(["better-sqlite3"], !props.meta.BATI.hasD1);
}
