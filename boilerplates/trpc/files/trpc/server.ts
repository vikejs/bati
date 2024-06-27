import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import { initTRPC } from "@trpc/server";

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
        await db.insert(todoTable).values({ text: opts.input });
      } else {
        // This is where you'd persist the data
        console.log("Received new todo", { text: opts.input });
      }
    }),
});

export type AppRouter = typeof appRouter;
