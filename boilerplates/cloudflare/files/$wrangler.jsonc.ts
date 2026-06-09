import { loadAsJson, type TransformerProps } from "@batijs/core";
import { wranglerEnv } from "../env";

export default async function getWrangler(props: TransformerProps): Promise<unknown> {
  const wrangler = await loadAsJson(props);

  // Inject environment variables
  const vars = wranglerEnv(props.env);
  if (Object.keys(vars).length > 0) wrangler.vars = { ...wrangler.vars, ...vars };

  // Better Auth relies on Node built-ins (node:crypto) at runtime, which the Workers runtime
  // only exposes with the nodejs_compat flag.
  if (props.meta.BATI.has("better-auth")) {
    wrangler.compatibility_flags ??= [];
    const flags = wrangler.compatibility_flags as string[];
    if (!flags.includes("nodejs_compat")) flags.push("nodejs_compat");
  }

  return wrangler;
}
