import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("drizzle:generate", {
      value: "drizzle-kit generate",
      precedence: 20,
    })
    .setScript("drizzle:migrate", {
      value: props.meta.BATI.hasD1 ? "wrangler d1 migrations apply YOUR_DATABASE_NAME --local" : "drizzle-kit migrate",
      precedence: 20,
    })
    .setScript("drizzle:studio", {
      value: "drizzle-kit studio",
      precedence: 20,
    })
    .addDependencies(["drizzle-kit", "drizzle-orm", "dotenv"])
    .addDevDependencies(["@types/better-sqlite3"], !props.meta.BATI.hasD1)
    .addDependencies(["better-sqlite3"], !props.meta.BATI.hasD1);
}
