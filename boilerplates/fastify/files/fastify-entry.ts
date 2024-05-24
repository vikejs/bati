// BATI.has("auth0")
import "dotenv/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authjsHandler } from "@batijs/authjs/server/authjs-handler";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter, type AppRouter } from "@batijs/trpc/trpc/server";
import {
  fastifyTRPCPlugin,
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { createRequestAdapter } from "@universal-middleware/express";
import express from "express";
import { auth, type ConfigParams } from "express-openid-connect";
import Fastify from "fastify";
import type { RouteHandlerMethod } from "fastify/types/route";
import { renderPage } from "vike/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;

interface Middleware<Context extends Record<string | number | symbol, unknown>> {
  (request: Request, context: Context): Response | void | Promise<Response> | Promise<void>;
}

export function handlerAdapter<Context extends Record<string | number | symbol, unknown>>(
  handler: Middleware<Context>,
) {
  const requestAdapter = createRequestAdapter();
  return (async (request, reply) => {
    const response = await handler(requestAdapter(request.raw)[0], request.routeOptions.config as unknown as Context);

    if (response) {
      return reply.send(response);
    }
  }) satisfies RouteHandlerMethod;
}

startServer();

async function startServer() {
  const app = Fastify();

  // Avoid pre-parsing body, otherwise it will cause issue with universal handlers
  // This will probably change in the future though, you can follow https://github.com/magne4000/universal-handler for updates
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", function (_request, _payload, done) {
    done(null, "");
  });

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
    app.all("/api/auth/*", handlerAdapter(authjsHandler));
  }

  if (BATI.has("firebase-auth")) {
    app.addHook("onRequest", handlerAdapter(firebaseAuthMiddleware));
    app.post("/api/sessionLogin", handlerAdapter(firebaseAuthLoginHandler));
    app.post("/api/sessionLogout", handlerAdapter(firebaseAuthLogoutHandler));
  }

  if (BATI.has("auth0")) {
    const config: ConfigParams = {
      authRequired: false, // Controls whether authentication is required for all routes
      auth0Logout: true, // Uses Auth0 logout feature
      baseURL: process.env.BASE_URL?.startsWith("http") ? process.env.BASE_URL : `http://localhost:${port}`, // The URL where the application is served
      routes: {
        login: "/api/auth/login", // Custom login route, default is "/login"
        logout: "/api/auth/logout", // Custom logout route, default is "/logout"
        callback: "/api/auth/callback", // Custom callback route, default is "/callback"
      },
    };

    const expressApp = express();

    app.use(expressApp.use(auth(config)));
  }

  if (BATI.has("trpc")) {
    /**
     * tRPC route
     *
     * @link {@see https://trpc.io/docs/server/adapters/fastify}
     **/
    await app.register(fastifyTRPCPlugin, {
      prefix: "/api/trpc",
      trpcOptions: {
        router: appRouter,
        createContext({ req, res }: CreateFastifyContextOptions) {
          return { req, res };
        },
        onError({ path, error }) {
          // report to error monitoring
          console.error(`Error in tRPC handler on path '${path}':`, error);
        },
      } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
    });
  }

  if (BATI.has("telefunc")) {
    /**
     * Telefunc route
     *
     * @link {@see https://telefunc.com}
     **/
    app.post<{ Body: string }>("/_telefunc", handlerAdapter(telefuncHandler));
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("/*", async function (request, reply) {
    const pageContextInit = BATI.has("auth0")
      ? { urlOriginal: request.originalUrl || request.url, user: request.raw.oidc.user }
      : BATI.has("firebase-auth")
        ? { urlOriginal: request.originalUrl || request.url, user: request.user }
        : { urlOriginal: request.originalUrl || request.url };

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
