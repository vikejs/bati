/*# BATI include-if-imported #*/
import { env as cloudflareEnv } from "cloudflare:workers";
//# !BATI.has("cloudflare")
import "./load.js";

/**
 * The ambient environment, regardless of platform. On Cloudflare it is the Worker's `env` binding;
 * everywhere else it is `process.env`, populated from `.env` by the side-effecting `./load` import
 * above. BATI strips the branch (and its import) that doesn't apply to the selected target.
 */
export const env: BATI.If<{ '!BATI.has("cloudflare")': Record<string, string | undefined> }> = BATI.has("cloudflare")
  ? (cloudflareEnv as BATI.Any)
  : typeof process?.env !== "undefined"
    ? process.env
    : {};
