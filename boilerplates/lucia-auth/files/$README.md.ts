import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Example: Lucia Auth with GitHub OAuth*
- Create a [GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Set the Authorization callback URL to \`http://localhost:3000/api/login/github/callback\`. 
- Copy your \`Client ID\` and \`Client Secret\` then paste it in \`.env\` file like this:

\`\`\`env
// .env
GITHUB_CLIENT_ID=<Client ID>
GITHUB_CLIENT_SECRET=<Client Secret>
\`\`\`

- Read more [Lucia Auth: OAuth](https://lucia-auth.com/guides/oauth/)

> [!NOTE]
> Username & Password signup route : \`http://localhost:3000/api/signup\`.  
> Username & Password login route : \`http://localhost:3000/api/login\`.  
> GitHub login route : \`http://localhost:3000/api/login/github\`.  
> Logout route : \`http://localhost:3000/api/auth/logout\`.
`;

  content.addMarkdownFeature(todo, "lucia-auth");

  return content.finalize();
}
