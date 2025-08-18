/*# BATI include-if-imported #*/

import { getDbFromRuntime } from "@batijs/d1/database/d1/helpers";
import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import type { D1Database } from "@cloudflare/workers-types";
import type { Get, UniversalMiddleware } from "@universal-middleware/core";

//# BATI.hasDatabase
declare global {
  namespace Universal {
    interface Context {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        "BATI.hasD1": D1Database;
      }>;
    }
  }
}

// Add `db` to the Context
export const dbMiddleware: Get<[], UniversalMiddleware> = () => async (_request, context, _runtime) => {
  const db =
    BATI.has("sqlite") && !BATI.hasD1
      ? sqliteDb()
      : BATI.has("drizzle") && !BATI.hasD1
        ? dbSqlite()
        : BATI.has("drizzle")
          ? dbD1(await getDbFromRuntime(_runtime))
          : await getDbFromRuntime(_runtime);

  return {
    ...context,
    db: db as BATI.Any,
  };
};
