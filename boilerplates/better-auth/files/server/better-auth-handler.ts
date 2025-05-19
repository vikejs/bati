/*# BATI include-if-imported #*/
import "@batijs/shared-db/server/db-middleware";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as authSchema from "@batijs/drizzle/database/drizzle/schema/better-auth";
import type { Get, UniversalHandler } from "@universal-middleware/core";

export const betterAuthHandler: Get<[], UniversalHandler> = () => async (request, context) => {
  const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || undefined,
    database: drizzleAdapter(context.db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    plugins: [],
  });
  return auth.handler(request);
};
