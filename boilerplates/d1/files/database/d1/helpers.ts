import type { D1Database } from "@cloudflare/workers-types";
import type { RuntimeAdapter } from "@universal-middleware/core";

/**
 * Retrieve Cloudflare `env.DB` from `universal-middleware` runtime
 */
export function getDbFromRuntime(runtime: RuntimeAdapter): D1Database {
  if (runtime.runtime === "workerd") {
    return runtime.env!.DB as D1Database;
  }
  throw new Error("Cloudflare runtime not found");
}
