import type { D1Database } from "@cloudflare/workers-types";
import type { RuntimeAdapter } from "@universal-middleware/core";

/**
 * Retrieve Cloudflare `env.DB` from `universal-middleware` runtime
 */
export async function getDbFromRuntime(runtime: RuntimeAdapter): Promise<D1Database> {
  if (runtime.runtime === "workerd" && runtime.env) {
    return runtime.env.DB as D1Database;
  }

  throw new Error("Database is not available");
}
