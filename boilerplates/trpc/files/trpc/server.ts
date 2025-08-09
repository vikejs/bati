import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/todos";
import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import type { D1Database } from "@cloudflare/workers-types";
import { initTRPC } from "@trpc/server";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC
  .context<
    BATI.If<{
      'BATI.has("sqlite") && !BATI.hasD1': { db: ReturnType<typeof sqliteDb> };
      'BATI.has("drizzle") && !BATI.hasD1': { db: ReturnType<typeof dbSqlite> };
      'BATI.has("drizzle")': { db: ReturnType<typeof dbD1> };
      "BATI.hasD1": { db: D1Database };
      _: object;
    }>
  >()
  .create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  demo: publicProcedure.query(async () => {
    return { demo: true };
  }),
  onNewTodo: publicProcedure
    .input((value): string => {
      if (typeof value === "string") {
        return value;
      }
      throw new Error("Input is not a string");
    })
    .mutation(async (opts) => {
      if (BATI.has("drizzle")) {
        await drizzleQueries.insertTodo(opts.ctx.db, opts.input);
      } else if (BATI.has("sqlite") && !BATI.hasD1) {
        sqliteQueries.insertTodo(opts.ctx.db, opts.input);
      } else if (BATI.hasD1) {
        await d1Queries.insertTodo(opts.ctx.db, opts.input);
      } else {
        // This is where you'd persist the data
        console.log("Received new todo", { text: opts.input });
      }
    }),
});

export type AppRouter = typeof appRouter;
