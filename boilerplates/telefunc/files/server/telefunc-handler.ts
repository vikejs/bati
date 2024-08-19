import { telefunc } from "telefunc";
import type { Get, UniversalHandler } from "@universal-middleware/core";

export const telefuncHandler: Get<[], UniversalHandler> = () => async (request, context) => {
  const httpResponse = await telefunc({
    url: request.url.toString(),
    method: request.method,
    body: await request.text(),
    context,
  });
  const { body, statusCode, contentType } = httpResponse;
  return new Response(body, {
    status: statusCode,
    headers: {
      "content-type": contentType,
    },
  });
};
