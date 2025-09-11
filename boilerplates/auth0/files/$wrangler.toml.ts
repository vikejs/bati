import type { TransformerProps } from "@batijs/core";

// TODO create a global util that can adapt to any kind of env adapter (dotenv/cloudflare/etc.)
export default async function getEnv(props: TransformerProps) {
  if (!props.meta.BATI.has("cloudflare")) return;

  const content = await props.readfile?.();

  if (!content) {
    throw new Error("wrangler.toml should not be empty");
  }

  const auth0ClientId = process.env.TEST_AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.TEST_AUTH0_CLIENT_SECRET;
  const auth0BaseUrl = process.env.TEST_AUTH0_ISSUER_BASE_URL;

  //language=toml
  const varsSnippet = `
# top level environment
[vars]
# Auth0 Client ID
AUTH0_CLIENT_ID = ${JSON.stringify(auth0ClientId ?? "")}
# Auth0 Client Secret
AUTH0_CLIENT_SECRET = ${JSON.stringify(auth0ClientSecret ?? "")}
# Auth0 base URL
AUTH0_ISSUER_BASE_URL = ${JSON.stringify(auth0BaseUrl ?? "")}
`;

  //language=toml
  return `${content}
${varsSnippet}`;
}
