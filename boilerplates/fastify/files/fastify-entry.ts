// BATI.has("auth0")
import "dotenv/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authjsHandler, authjsSessionMiddleware } from "@batijs/authjs/server/authjs-handler";
import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";
import {
  firebaseAuthLoginHandler,
  firebaseAuthLogoutHandler,
  firebaseAuthMiddleware,
} from "@batijs/firebase-auth/server/firebase-auth-middleware";
import { lowDb } from "@batijs/shared-no-db/database/todoItems";
import { vikeHandler } from "@batijs/shared-server/server/vike-handler";
import { createTodoHandler } from "@batijs/shared-todo/server/create-todo-handler";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter, type AppRouter } from "@batijs/trpc/trpc/server";
import { contract } from "@batijs/ts-rest/ts-rest/contract";
import {
  fastifyTRPCPlugin,
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { initServer } from "@ts-rest/fastify";
import { createRequestAdapter } from "@universal-middleware/express";
import Fastify from "fastify";
import type { RouteHandlerMethod } from "fastify/types/route";

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
    const config = request.routeOptions.config as unknown as Record<string, unknown>;
    config.context ??= {};
    const response = await handler(requestAdapter(request.raw)[0], config.context as Context);

    if (response) {
      if (!response.body) {
        // Fastify currently doesn't send a response for body is null.
        // To mimic express behavior, we convert the body to an empty ReadableStream.
        Object.defineProperty(response, "body", {
          value: new ReadableStream({
            start(controller) {
              controller.close();
            },
          }),
          writable: false,
          configurable: true,
        });
      }

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
  if (BATI.has("ts-rest")) {
    app.addContentTypeParser("application/json", { parseAs: "string" }, function (_request, payload, done) {
      if (typeof payload === "string") {
        const json = JSON.parse(payload);
        done(null, json);
      }
      done(null, "");
    });
  }

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

  if (BATI.has("authjs") || BATI.has("auth0")) {
    /**
     * Append Auth.js session to context
     **/
    app.addHook("onRequest", handlerAdapter(authjsSessionMiddleware));

    /**
     * Auth.js route
     * @link {@see https://authjs.dev/getting-started/installation}
     **/
    app.all("/api/auth/*", handlerAdapter(authjsHandler));
  }

  if (BATI.has("firebase-auth")) {
    app.addHook("onRequest", handlerAdapter(firebaseAuthMiddleware));
    app.post("/api/sessionLogin", handlerAdapter(firebaseAuthLoginHandler));
    app.post("/api/sessionLogout", handlerAdapter(firebaseAuthLogoutHandler));
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

  if (BATI.has("ts-rest")) {
    /**
     * ts-rest route
     *
     * @link {@see https://ts-rest.com/docs/fastify/}
     **/
    const s = initServer();
    const router = s.router(contract, {
      demo: async () => {
        return {
          status: 200,
          body: {
            demo: true,
          },
        };
      },
      createTodo: async ({ body }) => {
        if (BATI.has("drizzle")) {
          await db.insert(todoTable).values({ text: body.text });
        } else {
          lowDb.update(({ todo }) => todo.push({ text: body.text }));
        }
        return {
          status: 200,
          body: {
            status: "Ok",
          },
        };
      },
    });

    await app.register(s.plugin(router));
  }

  if (!BATI.has("telefunc") && !BATI.has("trpc") && !BATI.has("ts-rest")) {
    app.post("/api/todo/create", handlerAdapter(createTodoHandler));
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("/*", handlerAdapter(vikeHandler));

  app.listen(
    {
      port: port,
    },
    () => {
      console.log(`Server listening on http://localhost:${port}`);
    },
  );
}
