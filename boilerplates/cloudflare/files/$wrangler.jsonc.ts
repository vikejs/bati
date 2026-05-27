import { loadAsJson, type TransformerProps } from "@batijs/core";
import { wranglerEnv } from "../env";

// Injects the selected features' runtime env vars into wrangler.jsonc `vars`, so
// the worker boots with them (real deploys override via `wrangler secret`). This
// boilerplate owns the wrangler sink, so the file always exists here.
export default async function getWrangler(props: TransformerProps): Promise<unknown> {
  const wrangler = await loadAsJson(props);
  const vars = wranglerEnv(props.env);
  if (Object.keys(vars).length > 0) wrangler.vars = { ...wrangler.vars, ...vars };
  return wrangler;
}
