import { initTRPC } from "@trpc/server";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/todos";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/todos";
import * as d1Queries from "@batijs/d1/database/d1/queries/todos";
import { D1Database } from "@cloudflare/workers-types";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC
  //# BATI.hasD1
  .context<{ env: { DB: D1Database } }>()
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
        await drizzleQueries.insertTodo(opts.input);
      } else if (BATI.has("sqlite") && !BATI.hasD1) {
        sqliteQueries.insertTodo(opts.input);
      } else if (BATI.hasD1) {
        await d1Queries.insertTodo(opts.ctx.env.DB, opts.input);
      } else {
        // This is where you'd persist the data
        console.log("Received new todo", { text: opts.input });
      }
    }),
});

export type AppRouter = typeof appRouter;
