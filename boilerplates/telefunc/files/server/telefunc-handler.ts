import type { dbD1, dbSqlite } from "@batijs/drizzle/database/drizzle/db";
import type { db as sqliteDb } from "@batijs/sqlite/database/sqlite/db";
import type { D1Database } from "@cloudflare/workers-types";
import { enhance, type UniversalHandler } from "@universal-middleware/core";
import { telefunc } from "telefunc";

export const telefuncHandler: UniversalHandler = enhance(
  async (request, context, runtime) => {
    const httpResponse = await telefunc({
      url: request.url.toString(),
      method: request.method,
      body: await request.text(),
      context: {
        ...(context as BATI.If<{
          'BATI.has("sqlite") && !BATI.hasD1': { db: ReturnType<typeof sqliteDb> };
          'BATI.has("drizzle") && !BATI.hasD1': { db: ReturnType<typeof dbSqlite> };
          'BATI.has("drizzle")': { db: ReturnType<typeof dbD1> };
          "BATI.hasD1": { db: D1Database };
        }>),
        ...(runtime as BATI.If<{
          "BATI.hasD1": { runtime: "workerd"; adapter: "cloudflare-pages"; env?: { DB: D1Database } };
        }>),
      },
    });
    const { body, statusCode, contentType } = httpResponse;
    return new Response(body, {
      status: statusCode,
      headers: {
        "content-type": contentType,
      },
    });
  },
  {
    name: "my-app:telefunc-handler",
    path: `/_telefunc`,
    method: ["GET", "POST"],
    immutable: false,
  },
);
