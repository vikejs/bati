// BATI.has("auth0")
import "dotenv/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authjsHandler } from "@batijs/authjs/server/authjs-handler";
import { firebaseAuthMiddleware } from "@batijs/firebase-auth/files/server/firebase-auth-middleware";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import { createMiddleware } from "@hattip/adapter-node";
import * as trpcExpress from "@trpc/server/adapters/express";
import express, { type Request as ExpressRequest } from "express";
import { auth, type ConfigParams } from "express-openid-connect";
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
  return createMiddleware(
    async (context) => {
      const rawRequest = context.platform.request as unknown as Record<string, unknown>;
      rawRequest.context ??= {};
      const response = await handler(context.request, rawRequest.context as Context);

      if (!response) {
        context.passThrough();
        return new Response("", {
          status: 404,
        });
      }

      return response;
    },
    {
      alwaysCallNext: false,
    },
  );
}

startServer();

async function startServer() {
  const app = express();

  if (isProduction) {
    app.use(express.static(`${root}/dist/client`));
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
    app.use(handlerAdapter(firebaseAuthMiddleware));
    app.post("/api/sessionLogin", handlerAdapter(firebaseAuthLoginHandler));
    app.post("/api/sessionLogout", handlerAdapter(firebaseAuthLogoutHandler));
  }

  if (BATI.has("auth0")) {
    const config: ConfigParams = {
      authRequired: false, // Controls whether authentication is required for all routes
      auth0Logout: true, // Uses Auth0 logout feature
      baseURL: process.env.BASE_URL?.startsWith("http") ? process.env.BASE_URL : `http://localhost:${port}`, // The URL where the application is served
      routes: {
        login: "/api/auth/login", // Custom login route, default is : "/login"
        logout: "/api/auth/logout", // Custom logout route, default is : "/logout"
        callback: "/api/auth/callback", // Custom callback route, default is "/callback"
      },
    };

    app.use(auth(config));
  }

  if (BATI.has("trpc")) {
    /**
     * tRPC route
     *
     * @link {@see https://trpc.io/docs/server/adapters/express#3-use-the-express-adapter}
     **/
    app.use(
      "/api/trpc",
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext({ req, res }: trpcExpress.CreateExpressContextOptions) {
          return { req, res };
        },
      }),
    );
  }

  if (BATI.has("telefunc")) {
    /**
     * Telefunc route
     *
     * @link {@see https://telefunc.com}
     **/
    app.post("/_telefunc", handlerAdapter(telefuncHandler));
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("*", async (req: ExpressRequest, res, next) => {
    const pageContextInit = BATI.has("auth0")
      ? { urlOriginal: req.originalUrl, user: req.oidc.user }
      : BATI.has("firebase-auth")
        ? { urlOriginal: req.originalUrl, user: req.user }
        : { urlOriginal: req.originalUrl };

    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      return next();
    } else {
      const { statusCode, headers } = httpResponse;
      headers.forEach(([name, value]) => res.setHeader(name, value));
      res.status(statusCode);
      httpResponse.pipe(res);
    }
  });

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
