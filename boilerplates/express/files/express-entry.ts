// BATI.has("auth0") || BATI.hasDatabase
import "dotenv/config";
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
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import { createHandler, createMiddleware } from "@universal-middleware/express";
import { dbMiddleware } from "@batijs/shared-db/server/db-middleware";
import express from "express";
import { trpcHandler } from "@batijs/trpc/server/trpc-handler";
import { createDevMiddleware } from "vike";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;

export default (await startServer()) as unknown;

async function startServer() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(`${root}/dist/client`));
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
    app.use(viteDevMiddleware);
  }

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
    app.all("/api/auth/*", createHandler(authjsHandler)());
  }

  if (BATI.has("firebase-auth")) {
    app.use(createMiddleware(firebaseAuthMiddleware)());
    app.post("/api/sessionLogin", createHandler(firebaseAuthLoginHandler)());
    app.post("/api/sessionLogout", createHandler(firebaseAuthLogoutHandler)());
  }

  if (BATI.has("lucia-auth")) {
    app.use(createMiddleware(luciaDbMiddleware)());
    app.use(createMiddleware(luciaCsrfMiddleware)());
    app.use(createMiddleware(luciaAuthContextMiddleware)());
    app.use(createMiddleware(luciaAuthCookieMiddleware)());

    app.post("/api/signup", createHandler(luciaAuthSignupHandler)());
    app.post("/api/login", createHandler(luciaAuthLoginHandler)());
    app.post("/api/logout", createHandler(luciaAuthLogoutHandler)());
    app.get("/api/login/github", createHandler(luciaGithubLoginHandler)());
    app.get("/api/login/github/callback", createHandler(luciaGithubCallbackHandler)());
  }

  if (BATI.has("trpc")) {
    /**
     * tRPC route
     *
     * @link {@see https://trpc.io/docs/server/adapters/fetch}
     **/
    app.use("/api/trpc", createHandler(trpcHandler)("/api/trpc"));
  }

  if (BATI.has("telefunc")) {
    /**
     * Telefunc route
     *
     * @link {@see https://telefunc.com}
     **/
    app.post("/_telefunc", createHandler(telefuncHandler)());
  }

  if (BATI.has("ts-rest")) {
    app.all("/api/*", createHandler(tsRestHandler)());
  }

  if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
    app.post("/api/todo/create", createHandler(createTodoHandler)());
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("*", createHandler(vikeHandler)());

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  return app;
}
