import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Auth0*
- Sign up or login to an Auth0 account, then go to [your Dashboard](https://manage.auth0.com/dashboard/)
- Create Application -> Regular Web Application 
- What technology are you using for your project? -> Node.js (Express) -> Integrate Now
- Configure Auth0:
  - Allowed Callback URL: http://localhost:3000/api/auth/callback/auth0
  - Allowed Logout URLs: http://localhost:3000
- Save Changes
- Copy your \`Client ID\`, \`Client Secret\` and \`Domain\` and paste it in \`.env\` file like this:

\`\`\`env
// .env
AUTH0_CLIENT_SECRET=<Client Secret>
AUTH0_CLIENT_ID=<Client ID>
AUTH0_ISSUER_BASE_URL=https://<your-auth0-domain>.<eu>.auth0.com
\`\`\`

> [!NOTE]
> Login route is \`http://localhost:3000/api/auth/signin\`.
> Logout route is \`http://localhost:3000/api/auth/signout\`.

- Read more [Auth.js: Auth0 provider](https://authjs.dev/reference/core/providers/auth0)
`;

  content.addMarkdownFeature(todo, "auth0");

  return content;
}
