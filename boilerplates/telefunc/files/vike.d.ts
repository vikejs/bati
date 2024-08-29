import { D1Database } from "@cloudflare/workers-types";

//# BATI.hasD1
declare module "telefunc" {
  namespace Telefunc {
    interface Context {
      env: {
        DB: D1Database;
      };
    }
  }
}

export {};
