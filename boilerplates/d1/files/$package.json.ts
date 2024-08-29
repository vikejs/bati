import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  const files: string[] = ["database/d1/schema/todos.sql"];

  if (props.meta.BATI.has("lucia-auth")) {
    files.push("database/d1/schema/lucia-auth.sql");
  }

  packageJson.scripts["d1:migrate"] =
    `wrangler d1 execute YOUR_DATABASE_NAME ${files.map((f) => `--file=${f}`).join(" ")}}`;

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@universal-middleware/core"],
  });
}
