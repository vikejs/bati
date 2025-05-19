// BATI.has("auth0") || BATI.hasDatabase
import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import {
  luciaAuthContextMiddleware,
  luciaAuthCookieMiddleware,
  luciaAuthLoginHandler,
  luciaAuthLogoutHandler,
  luciaAuthSignupHandler,
  luciaCsrfMiddleware,
  luciaDbMiddleware,
  luciaGithubCallbackHandler,
  luciaGithubLoginHandler,
} from "@batijs/lucia-auth/server/lucia-auth-handlers";
import { betterAuthHandler } from "@batijs/better-auth/server/better-auth-handler";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import installCrypto from "@hattip/polyfills/crypto";
import installGetSetCookie from "@hattip/polyfills/get-set-cookie";
import installWhatwgNodeFetch from "@hattip/polyfills/whatwg-node";
import { type NodeHTTPCreateContextFnOptions, nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { createApp, createRouter, eventHandler, fromNodeMiddleware, toNodeListener } from "h3";
import serveStatic from "serve-static";
import { createHandler, createMiddleware, getContext } from "@universal-middleware/h3";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import { createDevMiddleware } from "vike";

installWhatwgNodeFetch();
installGetSetCookie();
installCrypto();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;

export default await startServer();

async function startServer() {
  const app = createApp();

  if (process.env.NODE_ENV === "production") {
    app.use("/", fromNodeMiddleware(serveStatic(`${root}/dist/client`)));
  } else {
    // Instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We should instantiate it *only* in development. (It isn't needed in production
    // and would unnecessarily bloat our server in production.)
    const viteDevMiddleware = (
      await createDevMiddleware({
        root,
        viteConfig: {
          server: { hmr: { port: hmrPort } },
        },
      })
    ).devMiddleware;
    app.use(fromNodeMiddleware(viteDevMiddleware));
  }

  const router = createRouter();

  if (BATI.hasDatabase) {
    /**
     * Make database available in Context as `context.db`
     */
    app.use(createMiddleware(dbMiddleware)());
  }

  if (BATI.has("authjs") || BATI.has("auth0")) {
    /**
     * Append Auth.js session to context
     **/
    app.use(createMiddleware(authjsSessionMiddleware)());

    /**
     * Auth.js route
     * @link {@see https://authjs.dev/getting-started/installation}
     **/
    router.use("/api/auth/**", createHandler(authjsHandler)());
  }

  if (BATI.has("firebase-auth")) {
    app.use(createMiddleware(firebaseAuthMiddleware)());
    router.post("/api/sessionLogin", createHandler(firebaseAuthLoginHandler)());
    router.post("/api/sessionLogout", createHandler(firebaseAuthLogoutHandler)());
  }

  if (BATI.has("lucia-auth")) {
    app.use(createMiddleware(luciaDbMiddleware)());
    app.use(createMiddleware(luciaCsrfMiddleware)());
    app.use(createMiddleware(luciaAuthContextMiddleware)());
    app.use(createMiddleware(luciaAuthCookieMiddleware)());

    router.post("/api/signup", createHandler(luciaAuthSignupHandler)());
    router.post("/api/login", createHandler(luciaAuthLoginHandler)());
    router.post("/api/logout", createHandler(luciaAuthLogoutHandler)());
    router.get("/api/login/github", createHandler(luciaGithubLoginHandler)());
    router.get("/api/login/github/callback", createHandler(luciaGithubCallbackHandler)());
  }

  if (BATI.has("better-auth")) {
    /**
     * Better-Auth route
     **/
    router.use("/api/auth/**", createHandler(betterAuthHandler)());
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
            return { ...getContext(event)!, req, res } as BATI.Any;
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
    router.post("/_telefunc", createHandler(telefuncHandler)());
  }

  if (BATI.has("ts-rest")) {
    router.use("/api/**", createHandler(tsRestHandler)());
  }

  if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
    router.post("/api/todo/create", createHandler(createTodoHandler)());
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  router.use("/**", createHandler(vikeHandler)());

  app.use(router);

  const server = createServer(toNodeListener(app));

  if (BATI.has("vercel")) {
    if (process.env.NODE_ENV !== "production") {
      server.listen(port);

      server.on("listening", () => {
        console.log(`Server listening on http://localhost:${port}`);
      });
    }
  } else {
    server.listen(port);

    server.on("listening", () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  }

  return server;
}
