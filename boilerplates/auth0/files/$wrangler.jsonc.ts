import type { TransformerProps } from "@batijs/core";
import { loadAsJson } from "@batijs/core";

// TODO create a global util that can adapt to any kind of env adapter (dotenv/cloudflare/etc.)
export default async function getEnv(props: TransformerProps) {
  if (!props.meta.BATI.has("cloudflare")) return;

  const wrangler = await loadAsJson(props);

  const auth0ClientId = process.env.TEST_AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.TEST_AUTH0_CLIENT_SECRET;
  const auth0BaseUrl = process.env.TEST_AUTH0_ISSUER_BASE_URL;

  wrangler.vars ??= {};
  wrangler.vars.AUTH0_CLIENT_ID = auth0ClientId ?? "";
  wrangler.vars.AUTH0_CLIENT_SECRET = auth0ClientSecret ?? "";
  wrangler.vars.AUTH0_ISSUER_BASE_URL = auth0BaseUrl ?? "";

  return wrangler;
}
