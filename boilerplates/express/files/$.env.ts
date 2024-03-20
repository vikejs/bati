import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const envContent = await props.readfile?.();

  if (props.meta.BATI.has("auth0")) {
    return appendToEnv(
      envContent,
      "SECRET",
      "LONG_RANDOM_STRING",
      `Environment variables declared in this file are automatically made available to Auth0.
See the documentation for more detail : https://auth0.com/docs/quickstart/webapp/express/interactive
Uncomment below environment variables.
CLIENT_ID=yourClientId
ISSUER_BASE_URL=https://your-auth0-domain.us.auth0.com`,
    );
  }

  return null;
}
