import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps): Promise<unknown> {
  const content = await loadMarkdown(props);
  const pmRun = packageManager().run;
  const { BATI } = props.meta;

  const migrateStep = BATI.hasD1
    ? `Create Better Auth's tables in your D1 database. Generate the SQL with \`npx @better-auth/cli generate\` and apply it as a [wrangler D1 migration](https://developers.cloudflare.com/d1/reference/migrations/).`
    : `Create Better Auth's tables (run again whenever the schema changes):
\`\`\`sh
${pmRun} better-auth:migrate
\`\`\``;

  //language=Markdown
  const todo = `
## Better Auth

Pages are scaffolded at \`/login\`, \`/signup\` and \`/account\` (the latter is protected and redirects to \`/login\`).

1. Replace \`BETTER_AUTH_SECRET\` in your \`.env\` with a strong, unique value before going to production — see <https://better-auth.com/docs/reference/options#secret>.
2. ${migrateStep}
3. (Optional) Enable GitHub sign-in: create a GitHub OAuth app (<https://github.com/settings/developers>), set the callback URL to \`<your-app-url>/api/auth/callback/github\`, and fill \`GITHUB_CLIENT_ID\` / \`GITHUB_CLIENT_SECRET\` in your \`.env\`. The button is hidden until both are set.

See <https://better-auth.com/docs> for adding more providers and plugins.`;

  content.addMarkdownFeature(todo, "better-auth");

  return content;
}
