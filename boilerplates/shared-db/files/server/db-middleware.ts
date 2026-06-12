/* $$.keepFileIfImported */

import { getDbFromRuntime } from "@batijs/d1/database/d1/helpers";
import { dbD1, dbPostgres, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import { dbKysely, dbKyselyD1, dbKyselyPostgres } from "@batijs/kysely/database/kysely/db";
import { db as pgDb } from "@batijs/postgres/database/postgres/db";
import { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import { enhance, type UniversalMiddleware } from "@universal-middleware/core";

// $$.BATI.hasDatabase
declare global {
  namespace Universal {
    interface Context {
      db: $$.If<{
        '$$.BATI.has("drizzle") && $$.BATI.has("postgres")': ReturnType<typeof dbPostgres>;
        '$$.BATI.has("kysely") && $$.BATI.has("postgres")': ReturnType<typeof dbKyselyPostgres>;
        '$$.BATI.has("postgres") && !$$.BATI.hasOrm': ReturnType<typeof pgDb>;
        '$$.BATI.has("sqlite") && !$$.BATI.hasD1 && !$$.BATI.hasOrm': ReturnType<typeof sqliteDb>;
        '$$.BATI.has("drizzle") && !$$.BATI.hasD1': ReturnType<typeof dbSqlite>;
        '$$.BATI.has("drizzle")': ReturnType<typeof dbD1>;
        '$$.BATI.has("kysely") && !$$.BATI.hasD1': ReturnType<typeof dbKysely>;
        '$$.BATI.has("kysely")': ReturnType<typeof dbKyselyD1>;
        "$$.BATI.hasD1 && !$$.BATI.hasOrm": D1Database;
      }>;
    }
  }
}

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
/**
 * Add the `db` object to the context.
 */
export const dbMiddleware: UniversalMiddleware = enhance(
  // The context we add here is automatically merged into pageContext
  async (_request, context, _runtime) => {
    const db =
      $$.BATI.has("drizzle") && $$.BATI.has("postgres")
        ? dbPostgres()
        : $$.BATI.has("kysely") && $$.BATI.has("postgres")
          ? dbKyselyPostgres()
          : $$.BATI.has("postgres") && !$$.BATI.hasOrm
            ? pgDb()
            : $$.BATI.has("sqlite") && !$$.BATI.hasD1 && !$$.BATI.hasOrm
              ? sqliteDb()
              : $$.BATI.has("drizzle") && !$$.BATI.hasD1
                ? dbSqlite()
                : $$.BATI.has("kysely") && !$$.BATI.hasD1
                  ? dbKysely()
                  : $$.BATI.has("kysely")
                    ? dbKyselyD1(await getDbFromRuntime(_runtime))
                    : $$.BATI.has("drizzle")
                      ? dbD1(await getDbFromRuntime(_runtime))
                      : await getDbFromRuntime(_runtime);

    return {
      ...context,
      // Sets pageContext.db
      db: db as $$.Any,
    };
  },
  {
    name: "my-app:db-middleware",
    immutable: false,
  },
);
