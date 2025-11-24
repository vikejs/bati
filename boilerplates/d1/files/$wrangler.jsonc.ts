import type { TransformerProps } from "@batijs/core";
import { loadAsJson } from "@batijs/core";

export default async function getToml(props: TransformerProps) {
  const wrangler = await loadAsJson(props);

  wrangler.d1_databases ??= [];
  wrangler.d1_databases.push({
    binding: "DB",
    database_name: "MY_VIKE_DEMO_DATABASE",
    database_id: "my-vike-demo-database",
    migrations_dir: "database/migrations",
  });

  return wrangler;
}
