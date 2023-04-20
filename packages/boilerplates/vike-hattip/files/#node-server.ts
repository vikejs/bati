import { createMiddleware } from "@hattip/adapter-node";
import { createRouter } from "@hattip/router";
import { renderPage } from "vite-plugin-ssr/server";
import { telefunc } from "telefunc";
import express from "express";
import { createServer } from "vite";

const app = express();
const router = createRouter();

if (import.meta.VIKE_MODULES?.includes("rpc:telefunc")) {
  router.post("/_telefunc", async (context) => {
    const httpResponse = await telefunc({
      url: context.url.toString(),
      method: context.method,
      body: await context.request.text(),
      context,
    });
    const { body, statusCode, contentType } = httpResponse;
    return new Response(body, {
      status: statusCode,
      headers: {
        "content-type": contentType,
      },
    });
  });
}

const viteDevMiddleware = (
  await createServer({
    server: { middlewareMode: true },
  })
).middlewares;

app.use(viteDevMiddleware);

router.use(async (context) => {
  const pageContextInit = { urlOriginal: context.request.url };
  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  return new Response(await response?.getBody(), {
    status: response?.statusCode,
    headers: response
      ? {
          "content-type": response.contentType,
        }
      : {},
  });
});

const hattip = createMiddleware(router.buildHandler());

app.use(hattip);

app.listen(3000, "localhost", () => {
  console.log("Server listening on http://localhost:3000");
});
