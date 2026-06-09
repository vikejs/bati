/*# BATI include-if-imported #*/
import { env as cloudflareEnv } from "cloudflare:workers";
//# !BATI.has("cloudflare")
import "./load.js";

export const env: BATI.If<{ '!BATI.has("cloudflare")': Record<string, string | undefined> }> = BATI.has("cloudflare")
  ? (cloudflareEnv as BATI.Any)
  : typeof process?.env !== "undefined"
    ? process.env
    : {};
