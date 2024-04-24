import CredentialsProvider from "@auth/core/providers/credentials";
import { appRouter } from "@batijs/trpc/trpc/server";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { telefunc } from "telefunc";
import { VikeAuth } from "vike-authjs";
import { renderPage } from "vike/server";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = new Hono();

app.use(compress());

if (isProduction) {
  app.use(
    "/*",
    serveStatic({
      root: `dist/client/`,
    }),
  );
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

  app.use("/api/auth/**", (c) =>
    Auth({
      request: c.req.raw,
    }),
  );
}

if (BATI.has("trpc")) {
  /**
   * tRPC route
   *
   * @link {@see https://trpc.io/docs/server/adapters}
   **/
  app.use("/api/trpc/*", (c) => {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext({ req, resHeaders }): FetchCreateContextFnOptions {
        return { req, resHeaders };
      },
    });
  });
}

if (BATI.has("telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  app.post("/_telefunc", async (c) => {
    const httpResponse = await telefunc({
      url: c.req.url.toString(),
      method: c.req.method,
      body: await c.req.text(),
      context: c,
    });
    const { body, statusCode, contentType } = httpResponse;

    c.status(statusCode);
    c.header("Content-Type", contentType);

    return c.body(body);
  });
}

app.all("*", async (c, next) => {
  const pageContextInit = {
    urlOriginal: c.req.url,
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    return next();
  } else {
    const { body, statusCode, headers } = httpResponse;
    headers.forEach(([name, value]) => c.header(name, value));
    c.status(statusCode);

    return c.body(body);
  }
});

if (isProduction) {
  console.log(`Server listening on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port: port,
  });
}

export default app;
