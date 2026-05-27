import { loadAsJson, type TransformerProps } from "@batijs/core";
import { wranglerEnv } from "../env";

export default async function getWrangler(props: TransformerProps): Promise<unknown> {
  const wrangler = await loadAsJson(props);

  // Inject environment variables
  const vars = wranglerEnv(props.env);
  if (Object.keys(vars).length > 0) wrangler.vars = { ...wrangler.vars, ...vars };
  return wrangler;
}
