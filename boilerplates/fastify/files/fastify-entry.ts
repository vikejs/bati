import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import CredentialsProvider from "@auth/core/providers/credentials";
import { createMiddleware } from "@hattip/adapter-node";
import Fastify from "fastify";
import { VikeAuth } from "vike-authjs";
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

  if (BATI.has("authjs")) {
    await app.register(await import("@fastify/formbody"));
    /**
     * AuthJS
     *
     * TODO: Replace secret {@see https://authjs.dev/reference/core#secret}
     * TODO: Choose and implement providers
     *
     * @link {@see https://authjs.dev/guides/providers/custom-provider}
     **/
    const Auth = VikeAuth({
      secret: "MY_SECRET",
      providers: [
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            username: { label: "Username", type: "text", placeholder: "jsmith" },
            password: { label: "Password", type: "password" },
          },
          async authorize() {
            // Add logic here to look up the user from the credentials supplied
            const user = { id: "1", name: "J Smith", email: "jsmith@example.com" };

            // Any object returned will be saved in `user` property of the JWT
            // If you return null then an error will be displayed advising the user to check their details.
            // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
            return user ?? null;
          },
        }),
      ],
    });

    app.addHook("onRequest", async (request, reply) => {
      const vikeAuth = createMiddleware(Auth, {
        alwaysCallNext: false,
      });
      const next = () =>
        new Promise<void>((resolve) => {
          vikeAuth(request.raw, reply.raw, () => resolve());
        });
      if (request.url.startsWith("/api/auth/")) {
        await next();
      }
      return;
    });
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("/*", async function (request, reply) {
    const pageContextInit = { urlOriginal: request.url };

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
