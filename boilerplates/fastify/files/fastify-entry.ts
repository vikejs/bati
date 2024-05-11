// BATI.has("auth0")
import "dotenv/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import CredentialsProvider from "@auth/core/providers/credentials";
import { firebaseAdmin } from "@batijs/firebase-auth/libs/firebaseAdmin";
import { appRouter, type AppRouter } from "@batijs/trpc/trpc/server";
import { createMiddleware } from "@hattip/adapter-node";
import {
  fastifyTRPCPlugin,
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import express from "express";
import { auth, type ConfigParams } from "express-openid-connect";
import Fastify from "fastify";
import { getAuth } from "firebase-admin/auth";
import { telefunc } from "telefunc";
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

  if (BATI.has("firebase-auth")) {
    await app.register(await import("@fastify/cookie"));

    app.addHook("onRequest", async (request) => {
      const sessionCookie = request.cookies.__session;
      if (sessionCookie) {
        try {
          const auth = getAuth(firebaseAdmin);
          const decodedIdToken = await auth.verifySessionCookie(sessionCookie);
          const user = await auth.getUser(decodedIdToken.sub);
          request.user = user;
        } catch (error) {
          console.debug("verifySessionCookie:", error);
          request.user = null;
        }
      }
    });

    app.post<{ Body: { idToken: string } }>("/api/sessionLogin", async (request, reply) => {
      const idToken = request.body.idToken || "";

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

      try {
        const auth = getAuth(firebaseAdmin);
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        reply.setCookie("__session", sessionCookie, {
          path: "/", // The path needs to be set manually; otherwise, it will default to "/api" in this case.
          maxAge: expiresIn,
          httpOnly: true,
          secure: true,
        });

        reply.code(200);
        return reply.send({ status: "success" });
      } catch (error) {
        console.error("createSessionCookie failed :", error);

        reply.code(401);
        return reply.send({ status: "Unauthorized" });
      }
    });

    app.post("/api/sessionLogout", (_, reply) => {
      reply.clearCookie("__session");
      reply.code(200);
      return reply.send({ status: "Logged Out" });
    });
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
    app.post<{ Body: string }>("/_telefunc", async (request, reply) => {
      const httpResponse = await telefunc({
        url: request.originalUrl || request.url,
        method: request.method,
        body: request.body,
        context: request,
      });
      const { body, statusCode, contentType } = httpResponse;

      reply.code(statusCode);
      reply.type(contentType);
      return reply.send(body);
    });
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
