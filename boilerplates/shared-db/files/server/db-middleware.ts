/*# BATI include-if-imported #*/

import { getDbFromRuntime } from "@batijs/d1/database/d1/helpers";
import { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { dbKysely, dbKyselyD1 } from "@batijs/kysely/database/kysely/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import { enhance, type UniversalMiddleware } from "@universal-middleware/core";

//# BATI.hasDatabase
declare global {
  namespace Universal {
    interface Context {
      db: BATI.If<{
        'BATI.has("sqlite") && !BATI.hasD1': ReturnType<typeof sqliteDb>;
        'BATI.has("drizzle") && !BATI.hasD1': ReturnType<typeof dbSqlite>;
        'BATI.has("drizzle")': ReturnType<typeof dbD1>;
        'BATI.has("kysely") && !BATI.hasD1': ReturnType<typeof dbKysely>;
        'BATI.has("kysely")': ReturnType<typeof dbKyselyD1>;
        "BATI.hasD1": D1Database;
      }>;
    }
  }
}

// Note: You can use your server directly instead of defining a universal middleware. (Bati uses https://github.com/magne4000/universal-middleware to simplify its internal logic.)
/**
 * Add the `db` object to the context.
 */
export const dbMiddleware: UniversalMiddleware = enhance(
  // The context we add here is automatically merged into pageContext
  async (_request, context, _runtime) => {
    const db =
      BATI.has("sqlite") && !BATI.hasD1
        ? sqliteDb()
        : BATI.has("drizzle") && !BATI.hasD1
          ? dbSqlite()
          : BATI.has("kysely") && !BATI.hasD1
            ? dbKysely()
            : BATI.has("kysely")
              ? dbKyselyD1(await getDbFromRuntime(_runtime))
              : BATI.has("drizzle")
                ? dbD1(await getDbFromRuntime(_runtime))
                : await getDbFromRuntime(_runtime);

    return {
      ...context,
      // Sets pageContext.db
      db: db as BATI.Any,
    };
  },
  {
    name: "my-app:db-middleware",
    immutable: false,
  },
);
