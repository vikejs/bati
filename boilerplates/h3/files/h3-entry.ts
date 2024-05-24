// BATI.has("auth0")
import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authjsHandler } from "@batijs/authjs/server/authjs-handler";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import installCrypto from "@hattip/polyfills/crypto";
import installGetSetCookie from "@hattip/polyfills/get-set-cookie";
import installWhatwgNodeFetch from "@hattip/polyfills/whatwg-node";
import { nodeHTTPRequestHandler, type NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import express from "express";
import { auth, type ConfigParams } from "express-openid-connect";
import {
  createApp,
  createRouter,
  eventHandler,
  fromNodeMiddleware,
  fromWebHandler,
  toNodeListener,
  toWebRequest,
} from "h3";
import serveStatic from "serve-static";

installWhatwgNodeFetch();
installGetSetCookie();
installCrypto();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;

interface Middleware<Context extends Record<string | number | symbol, unknown>> {
  (request: Request, context: Context): Response | void | Promise<Response> | Promise<void>;
}

export function fromWebMiddleware<Context extends Record<string | number | symbol, unknown>>(
  handler: Middleware<Context>,
) {
  return eventHandler((event) => {
    const ctx = event.context as unknown as Record<string, unknown>;
    ctx.context ??= {};
    return handler(toWebRequest(event), ctx.context as Context);
  });
}

startServer();

async function startServer() {
  const app = createApp();

  if (isProduction) {
    app.use("/", fromNodeMiddleware(serveStatic(`${root}/dist/client`)));
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
    app.use(fromNodeMiddleware(viteDevMiddleware));
  }

  const router = createRouter();

  if (BATI.has("authjs")) {
    router.use("/api/auth/**", fromWebHandler(authjsHandler));
  }

  if (BATI.has("firebase-auth")) {
    app.use(fromWebMiddleware(firebaseAuthMiddleware));
    router.post("/api/sessionLogin", fromWebHandler(firebaseAuthLoginHandler));
    router.post("/api/sessionLogout", fromWebHandler(firebaseAuthLogoutHandler));
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

    app.use(fromNodeMiddleware(expressApp.use(auth(config))));
  }

  if (BATI.has("trpc")) {
    /**
     * tRPC route
     *
     * @link {@see https://trpc.io/docs/server/adapters}
     **/
    router.use(
      "/api/trpc/**:path",
      eventHandler((event) =>
        nodeHTTPRequestHandler({
          req: event.node.req,
          res: event.node.res,
          path: event.context.params!.path,
          router: appRouter,
          createContext({ req, res }: NodeHTTPCreateContextFnOptions<IncomingMessage, ServerResponse>) {
            return { req, res };
          },
        }),
      ),
    );
  }

  if (BATI.has("telefunc")) {
    /**
     * Telefunc route
     *
     * @link {@see https://telefunc.com}
     **/
    router.post("/_telefunc", fromWebHandler(telefuncHandler));
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  router.use("/**", fromWebHandler(vikeHandler));

  app.use(router);

  const server = createServer(toNodeListener(app)).listen(port);

  server.on("listening", () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
