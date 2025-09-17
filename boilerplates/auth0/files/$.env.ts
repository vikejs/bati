import { appendToEnv, type TransformerProps } from "@batijs/core";

// TODO create a global util that can adapt to any kind of env adapter (dotenv/cloudflare/etc.)
export default async function getEnv(props: TransformerProps) {
  if (props.meta.BATI.has("cloudflare")) return;
  const auth0ClientId = process.env.TEST_AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.TEST_AUTH0_CLIENT_SECRET;
  const auth0BaseUrl = process.env.TEST_AUTH0_ISSUER_BASE_URL;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "AUTH0_CLIENT_ID", auth0ClientId ?? "", "Auth0 Client ID");
  envContent = appendToEnv(envContent, "AUTH0_CLIENT_SECRET", auth0ClientSecret ?? "", "Auth0 Client Secret");
  envContent = appendToEnv(envContent, "AUTH0_ISSUER_BASE_URL", auth0BaseUrl ?? "", "Auth0 base URL");

  return envContent;
}
