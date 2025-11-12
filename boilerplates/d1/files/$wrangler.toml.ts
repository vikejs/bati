import type { TransformerProps } from "@batijs/core";

export default async function getToml(props: TransformerProps) {
  const content = await props.readfile?.();

  if (!content) {
    throw new Error("wrangler.toml should not be empty");
  }

  //language=toml
  const dbSnippet = `
# https://developers.cloudflare.com/d1/build-with-d1/local-development/#develop-locally-with-pages
[[d1_databases]]
binding = "DB" # Should match preview_database_id
database_name = "MY_VIKE_DEMO_DATABASE"
database_id = "my-vike-demo-database"
preview_database_id = "DB" # Required for Pages local development
migrations_dir = "database/migrations"
`;

  //language=toml
  return `${content}
${dbSnippet}`;
}
