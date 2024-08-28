import { D1Database } from "@cloudflare/workers-types";

declare global {
  // Cloudflare typings
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
      };
    }
  }
}

export {};
