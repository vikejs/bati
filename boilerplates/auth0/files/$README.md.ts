import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  if (props.meta.BATI.has("auth0")) {
    //language=Markdown
    const todo = `
## *Auth0*
- You first need to Sign up or login to your existing Auth0 account. Then go to your Auth0 Dashboard.
- Create Application -> Regular Web Application 
- What technology are you using for your project? -> Node.js (Express) -> Integrate Now.
- Configure Auth0 :
  - Allowed Callback URL : http://localhost:3000/callback
  - Allowed Logout URLs : http://localhost:3000
- Save Settings And Continue.
- Copy your \`clientID\` and \`issuerBaseURL\` and paste it in \`.env\` file like this:

\`\`\`env
// .env
SECRET=LONG_RANDOM_STRING
CLIENT_ID=yourClientId
ISSUER_BASE_URL=https://your-auth0-domain.us.auth0.com
\`\`\`

> [!TIP]
> You can generate a suitable string for \`SECRET\` using \`openssl rand -hex 32\` on the command line.

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

  return null;
}
