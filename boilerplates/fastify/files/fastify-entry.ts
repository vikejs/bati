import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { renderPage } from "vike/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;

startServer();

async function startServer() {
  const app = Fastify();

  await app.register(await import("@fastify/middie"));

  if (isProduction) {
    await app.register(await import("@fastify/static"), {
      root: `${root}/dist/client`,
      wildcard: false,
    });
  } else {
    // Instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We should instantiate it *only* in development. (It isn't needed in production
    // and would unnecessarily bloat our server in production.)
    const vite = await import("vite");
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true, hmr: { port: hmrPort } },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/

  app.all("/*", async function (req, reply) {
    const pageContextInit = { urlOriginal: req.url };

    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      return;
    } else {
      const { statusCode, headers, body } = httpResponse;

      headers.forEach(([name, value]) => reply.header(name, value));
      reply.code(statusCode);

      return reply.send(body);
    }
  });

  app.listen(
    {
      port: port,
    },
    () => {
      console.log(`Server listening on http://localhost:${port}`);
    },
  );
}
