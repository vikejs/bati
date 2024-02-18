import "dotenv/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import CredentialsProvider from "@auth/core/providers/credentials";
import { appRouter } from "@batijs/trpc/trpc/server";
import { createMiddleware } from "@hattip/adapter-node";
import * as trpcExpress from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import express, { type Request } from "express";
import { applicationDefault, deleteApp, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { telefunc } from "telefunc";
import { VikeAuth } from "vike-authjs";
import { renderPage } from "vike/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const root = __dirname;

/*{ @if (it.BATI.has("firebase-auth")) }*/
let admin: App | undefined;

function initializeAdminApp() {
  return initializeApp({
    credential: applicationDefault(),
  });
}

if (!getApps().length) {
  admin = initializeAdminApp();
} else {
  admin = getApp();
  deleteApp(admin);
  admin = initializeAdminApp();
}
/*{ /if }*/

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
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
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

    app.all(
      "/api/auth/*",
      createMiddleware(Auth, {
        alwaysCallNext: false,
      }),
    );
  }

  if (BATI.has("firebase-auth")) {
    app.use(cookieParser());
    app.use(async function (req: Request, _, next) {
      const sessionCookie: string = req.cookies.__session || "";

      try {
        const auth = getAuth();
        const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
        const user = await auth.getUser(decodedIdToken.sub);
        req.user = user;
      } catch (error) {
        console.log("error verifySessionCookie :", error);
        req.user = null;
      }

      next();
    });

    app.use(express.json()); // Parse & make HTTP request body available at `req.body`
    app.post("/api/sessionLogin", (req: Request, res) => {
      const idToken: string = req.body.idToken || "";

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

      getAuth()
        .createSessionCookie(idToken, { expiresIn })
        .then(
          (sessionCookie) => {
            // Set cookie policy for session cookie.
            const options = { maxAge: expiresIn, httpOnly: true, secure: true };
            res.cookie("__session", sessionCookie, options);
            res.end(JSON.stringify({ status: "success" }));
          },
          (error) => {
            console.log("createSessionCookie error :", error);
            res.status(401).send("UNAUTHORIZED REQUEST!");
          },
        );
    });

    app.post("/api/sessionLogout", function (_, res) {
      res.clearCookie("__session");
      res.end();
    });
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
    app.post(
      "/_telefunc",
      createMiddleware(
        async (context) => {
          const httpResponse = await telefunc({
            url: context.request.url.toString(),
            method: context.request.method,
            body: await context.request.text(),
            context,
          });
          const { body, statusCode, contentType } = httpResponse;
          return new Response(body, {
            status: statusCode,
            headers: {
              "content-type": contentType,
            },
          });
        },
        {
          alwaysCallNext: false,
        },
      ),
    );
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("*", async (req: Request, res, next) => {
    const pageContextInit = BATI.has("firebase-auth")
      ? { urlOriginal: req.originalUrl, user: req.user }
      : { urlOriginal: req.originalUrl };

    const pageContext = await renderPage(pageContextInit);
    if (pageContext.httpResponse === null) return next();

    const { statusCode, contentType } = pageContext.httpResponse;
    res.status(statusCode).type(contentType);
    pageContext.httpResponse.pipe(res);
  });

  app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000, () => {
    console.log("Server listening on http://localhost:3000");
  });
}
