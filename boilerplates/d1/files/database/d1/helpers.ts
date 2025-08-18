import type { D1Database } from "@cloudflare/workers-types";
import type { RuntimeAdapter } from "@universal-middleware/core";

/**
 * Retrieve Cloudflare `env.DB` from `universal-middleware` runtime
 */
export async function getDbFromRuntime(runtime: RuntimeAdapter): Promise<D1Database> {
  if (runtime.runtime === "workerd") {
    // biome-ignore lint/style/noNonNullAssertion: always exists
    return runtime.env!.DB as D1Database;
  }

  if (process.env.NODE_ENV !== "production") {
    // When running on node, simulate Cloudflare environment with "wrangler"
    const { getPlatformProxy } = await import("wrangler");
    const { env } = await getPlatformProxy();
    return env.DB as D1Database;
  }

  throw new Error("Database not available in production build");
}
