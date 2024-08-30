import { telefunc } from "telefunc";
import type { Get, UniversalHandler } from "@universal-middleware/core";
import type { D1Database } from "@cloudflare/workers-types";

export const telefuncHandler: Get<[], UniversalHandler> = () => async (request, context, runtime) => {
  const httpResponse = await telefunc({
    url: request.url.toString(),
    method: request.method,
    body: await request.text(),
    context: {
      ...context,
      ...(runtime as BATI.If<{
        "BATI.hasD1": { runtime: "workerd"; adapter: string; env: { DB: D1Database } };
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
};
