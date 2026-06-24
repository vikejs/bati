import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("authjs") || meta.BATI.has("auth0");
  },
  knip: {
    entry: ["server/authjs-handler.ts"],
  },
  // Auth skill — covers Auth.js and the Auth0 provider.
  skills(meta) {
    const auth0 = meta.BATI.has("auth0");
    return [
      {
        name: "auth",
        description:
          "How authentication works in this app (Auth.js). Use when reading the session, protecting a route, or configuring providers.",
        body: `Auth.js. Config + providers live in \`server/authjs-handler.ts\` (\`authjsConfig.providers\`, base path \`/api/auth\`); \`authjsSessionMiddleware\` populates \`pageContext.session\`.

- **Read the session:** \`pageContext.session\` (an Auth.js \`Session | null\`; the user is \`session.user\`).
- **Protect a route:** add a \`+guard.ts\` beside the page — \`if (!pageContext.session) throw redirect("/login")\`.
- **Add a provider:** add it to the \`providers\` array in \`server/authjs-handler.ts\`${auth0 ? " (the Auth0 provider is already wired; its credentials are in `.env`)" : ""}.
- **Secret:** replace the placeholder \`secret\` (\`"MY_SECRET"\`) — see https://authjs.dev/reference/core#secret.

See https://authjs.dev.`,
      },
    ];
  },
});
