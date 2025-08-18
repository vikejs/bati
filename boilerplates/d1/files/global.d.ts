import type { D1Database } from "@cloudflare/workers-types";

// Cloudflare typings
interface Env {
  DB: D1Database;
}

declare global {
  namespace Vike {
    interface PageContext {
      env: Env;
    }
  }
}
