import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { todoItems } from "@batijs/shared-db/database/todoItems";
import { initTRPC } from "@trpc/server";
import type { RunResult } from "better-sqlite3";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();

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
        const result: RunResult = await db.insert(todoTable).values({ text: opts.input });
        return result;
      } else {
        todoItems.push({ text: opts.input });
        return { todoItems };
      }
    }),
});

export type AppRouter = typeof appRouter;
