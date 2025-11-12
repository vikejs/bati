import type { TransformerProps } from "@batijs/core";

export default async function getToml(props: TransformerProps) {
  const content = await props.readfile?.();

  if (!content) {
    throw new Error("wrangler.toml should not be empty");
  }

  //language=toml
  const dbSnippet = `
# https://developers.cloudflare.com/d1/get-started/
[[d1_databases]]
binding = "DB"
database_name = "MY_VIKE_DEMO_DATABASE"
database_id = "my-vike-demo-database"
migrations_dir = "database/migrations"
`;

  //language=toml
  return `${content}
${dbSnippet}`;
}
