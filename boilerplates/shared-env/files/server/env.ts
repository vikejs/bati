/*# $$.includeIfImported #*/
import { env as cloudflareEnv } from "cloudflare:workers";
//# !$$.BATI.has("cloudflare")
import "./load.js";

export const env: $$.If<{ '!$$.BATI.has("cloudflare")': Record<string, string | undefined> }> = $$.BATI.has(
  "cloudflare",
)
  ? (cloudflareEnv as $$.Any)
  : typeof process?.env !== "undefined"
    ? process.env
    : {};
