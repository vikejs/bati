/*# BATI include-if-imported #*/

import type { Get, UniversalMiddleware } from "@universal-middleware/core";
import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import { getDbFromRuntime } from "@batijs/d1/database/d1/helpers";

//# BATI.hasDatabase
declare global {
  namespace Universal {
    interface Context {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
      }>;
    }
  }
}

// Add `db` to the Context
export const dbMiddleware: Get<[], UniversalMiddleware> = () => (_request, context, _runtime) => {
  const db =
    BATI.has("sqlite") && !BATI.hasD1
      ? sqliteDb()
      : BATI.has("drizzle") && !BATI.hasD1
        ? dbSqlite()
        : BATI.has("drizzle")
          ? dbD1(getDbFromRuntime(_runtime))
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (undefined as any);

  return {
    ...context,
    db,
  };
};
