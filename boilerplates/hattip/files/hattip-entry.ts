import CredentialsProvider from "@auth/core/providers/credentials";
import { telefuncHandler } from "@batijs/telefunc/server/telefunc-handler";
import { appRouter } from "@batijs/trpc/trpc/server";
import type { HattipHandler } from "@hattip/core";
import { createRouter, type RouteHandler } from "@hattip/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { VikeAuth } from "vike-authjs";
import { renderPage } from "vike/server";

function handlerAdapter<Context extends Record<string | number | symbol, unknown>>(
  handler: (request: Request, context: Context) => Promise<Response>,
): RouteHandler<unknown, unknown> {
  return (context) => {
    return handler(context.request, context as unknown as Context);
  };
}

const router = createRouter();

if (BATI.has("telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  router.post("/_telefunc", handlerAdapter(telefuncHandler));
}

if (BATI.has("trpc")) {
  /**
   * tRPC route
   *
   * @link {@see https://trpc.io/docs/server/adapters/fetch}
   **/
  router.use("/api/trpc/*", (context) => {
    return fetchRequestHandler({
      router: appRouter,
      req: context.request,
      endpoint: "/api/trpc",
      createContext({ req }) {
        return { req };
      },
    });
  });
}

if (BATI.has("authjs")) {
  /**
   * AuthJS
   *
   * TODO: Replace secret {@see https://authjs.dev/reference/core#secret}
   * TODO: Choose and implement providers
   *
   * @link {@see https://authjs.dev/guides/providers/custom-provider}
   **/
  const Auth = VikeAuth({
    secret: "MY_SECRET", // See

    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          username: { label: "Username", type: "text", placeholder: "username" },
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

  router.get("/api/auth/*", Auth);
  router.post("/api/auth/*", Auth);
}

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
router.use(async (context) => {
  const pageContextInit = { urlOriginal: context.request.url };
  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  return new Response(await response?.getBody(), {
    status: response?.statusCode,
    headers: response?.headers,
  });
});

export default router.buildHandler() as HattipHandler;
