import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const todo = `
## *Auth0*
- Sign up or login to an Auth0 account, then go to [your Dashboard](https://manage.auth0.com/dashboard/)
- Create Application -> Regular Web Application 
- What technology are you using for your project? -> Node.js (Express) -> Integrate Now
- Configure Auth0:
  - Allowed Callback URL: http://localhost:3000/api/auth/callback
  - Allowed Logout URLs: http://localhost:3000
- Save Changes
- Copy your \`clientID\` and \`issuerBaseURL\` and paste it in \`.env\` file like this:

\`\`\`env
// .env
SECRET=<random string>
CLIENT_ID=<Client ID>
CLIENT_SECRET=<Client Secret>
ISSUER_BASE_URL=https://<your-auth0-domain>.<eu>.auth0.com
\`\`\`

> [!NOTE]
> Environment variables that are automatically made available to Auth0 :
> - \`SECRET\`
> - \`ISSUER_BASE_URL\`
> - \`BASE_URL\`
> - \`CLIENT_ID\`
> - \`CLIENT_SECRET\`

> [!NOTE]
> Login route is \`http://localhost:3000/login\`.
> Logout route is \`http://localhost:3000/logout\`.

- Read more [Auth0 Express SDK Quickstarts: Login](https://auth0.com/docs/quickstart/webapp/express)
- Read more [Auth0 Express SDK Quickstarts: Add Login to your Express App](https://auth0.com/docs/quickstart/webapp/express/interactive)
`;

  content.addTodo(todo);

  return content.finalize();
}
