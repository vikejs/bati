import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const auth0ClientId = process.env.TEST_AUTH0_CLIENT_ID;
  const auth0BaseUrl = process.env.TEST_AUTH0_ISSUER_BASE_URL;
  const auth0ClientSecret = process.env.TEST_AUTH0_CLIENT_SECRET;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "AUTH0_CLIENT_ID", auth0ClientId ?? "", "Auth0 Client ID");
  envContent = appendToEnv(envContent, "AUTH0_CLIENT_SECRET", auth0ClientSecret ?? "", "Auth0 Client Secret");
  envContent = appendToEnv(envContent, "AUTH0_ISSUER_BASE_URL", auth0BaseUrl ?? "", "Auth0 base URL");

  return envContent;
}
