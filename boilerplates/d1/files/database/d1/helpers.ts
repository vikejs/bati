import type { D1Database } from "@cloudflare/workers-types";
import type { RuntimeAdapter } from "@universal-middleware/core";

/**
 * Retrieve Cloudflare `env.DB` from `universal-middleware` runtime
 */
export async function getDbFromRuntime(runtime: RuntimeAdapter): Promise<D1Database> {
  if (BATI.has("h3")) {
    if (runtime.runtime === "workerd" && runtime.adapter === "h3") {
      return runtime.h3.context.DB as D1Database;
    }
  } else {
    if (runtime.runtime === "workerd" && runtime.env) {
      return runtime.env.DB as D1Database;
    }
  }

  throw new Error("Database is not available");
}
