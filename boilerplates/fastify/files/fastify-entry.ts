// BATI.has("auth0") || BATI.has("lucia-auth")
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
  luciaGithubCallbackHandler,
  luciaGithubLoginHandler,
} from "@batijs/lucia-auth/server/lucia-auth-handlers";
import { createTodoHandler } from "@batijs/shared-server/server/create-todo-handler";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter, type AppRouter } from "@batijs/trpc/trpc/server";
import { tsRestHandler } from "@batijs/ts-rest/server/ts-rest-handler";
import {
  type CreateFastifyContextOptions,
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { createHandler, createMiddleware } from "@universal-middleware/fastify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;

async function startServer() {
  const app = Fastify();

  // Avoid pre-parsing body, otherwise it will cause issue with universal handlers
  // This will probably change in the future though, you can follow https://github.com/magne4000/universal-middleware for updates
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", function (_request, _payload, done) {
    done(null, "");
  });

  await app.register(await import("@fastify/middie"));

  if (process.env.NODE_ENV === "production") {
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

  if (BATI.has("authjs") || BATI.has("auth0")) {
    /**
     * Append Auth.js session to context
     **/
    app.register(createMiddleware(authjsSessionMiddleware)());

    /**
     * Auth.js route
     * @link {@see https://authjs.dev/getting-started/installation}
     **/
    app.all("/api/auth/*", createHandler(authjsHandler)());
  }

  if (BATI.has("firebase-auth")) {
    app.register(createMiddleware(firebaseAuthMiddleware)());
    app.post("/api/sessionLogin", createHandler(firebaseAuthLoginHandler)());
    app.post("/api/sessionLogout", createHandler(firebaseAuthLogoutHandler)());
  }

  if (BATI.has("lucia-auth")) {
    app.register(createMiddleware(luciaCsrfMiddleware)());
    app.register(createMiddleware(luciaAuthContextMiddleware)());
    app.register(createMiddleware(luciaAuthCookieMiddleware)());

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
    app.post<{ Body: string }>("/_telefunc", createHandler(telefuncHandler)());
  }

  if (BATI.has("ts-rest")) {
    app.all("/api/*", createHandler(tsRestHandler));
  }

  if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
    app.post("/api/todo/create", createHandler(createTodoHandler)());
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("/*", createHandler(vikeHandler)());

  return app;
}

const app = await startServer();

//# BATI.has('vercel')
// Vercel handler
export default async (req: Request, res: Response) => {
  await app.ready();
  app.server.emit("request", req, res);
};

if (BATI.has("vercel")) {
  // Development listener
  if (process.env.NODE_ENV !== "production") {
    app.listen(
      {
        port: port,
      },
      () => {
        console.log(`Server listening on http://localhost:${port}`);
      },
    );
  }
} else {
  app.listen(
    {
      port: port,
    },
    () => {
      console.log(`Server listening on http://localhost:${port}`);
    },
  );
}
