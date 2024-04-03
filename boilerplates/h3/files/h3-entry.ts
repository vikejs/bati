import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import CredentialsProvider from "@auth/core/providers/credentials";
import { firebaseAdmin } from "@batijs/firebase-auth/libs/firebaseAdmin";
import { appRouter } from "@batijs/trpc/trpc/server";
import installCrypto from "@hattip/polyfills/crypto";
import installGetSetCookie from "@hattip/polyfills/get-set-cookie";
import installWhatwgNodeFetch from "@hattip/polyfills/whatwg-node";
import { nodeHTTPRequestHandler, type NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import {
  createApp,
  createRouter,
  deleteCookie,
  eventHandler,
  fromNodeMiddleware,
  getCookie,
  getResponseStatus,
  getResponseStatusText,
  readBody,
  setCookie,
  setResponseHeaders,
  setResponseStatus,
  toNodeListener,
  toWebRequest,
} from "h3";
import serveStatic from "serve-static";
import { telefunc } from "telefunc";
import { VikeAuth } from "vike-authjs";
import { renderPage } from "vike/server";

installWhatwgNodeFetch();
installGetSetCookie();
installCrypto();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const root = __dirname;

/*{ @if (it.BATI.has("firebase-auth")) }*/
declare module "h3" {
  interface H3EventContext {
    user: UserRecord | null;
  }
}
/*{ /if }*/

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
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(fromNodeMiddleware(viteDevMiddleware));
  }

  const router = createRouter();

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

    router.use(
      "/api/auth/**",
      eventHandler((event) =>
        Auth({
          request: toWebRequest(event),
        }),
      ),
    );
  }

  if (BATI.has("firebase-auth")) {
    app.use(
      eventHandler(async (event) => {
        const sessionCookie = getCookie(event, "__session");
        if (sessionCookie) {
          try {
            const auth = getAuth(firebaseAdmin);
            const decodedIdToken = await auth.verifySessionCookie(sessionCookie);
            const user = await auth.getUser(decodedIdToken.sub);
            event.context.user = user;
          } catch (error) {
            console.error("verifySessionCookie:", error);
            event.context.user = null;
          }
        }
      }),
    );

    router.post(
      "/api/sessionLogin",
      eventHandler(async (event) => {
        const body = await readBody(event);
        const idToken: string = body.idToken || "";

        let status: number;
        let text: string;

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

        try {
          const auth = getAuth(firebaseAdmin);
          const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
          setCookie(event, "__session", sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: true,
          });
          setResponseStatus(event, 200, "Success");

          status = getResponseStatus(event);
          text = getResponseStatusText(event);
        } catch (error) {
          console.error("createSessionCookie:", error);
          setResponseStatus(event, 401, "Unauthorized Request");
          status = getResponseStatus(event);
          text = getResponseStatusText(event);
        }

        return {
          status,
          text,
        };
      }),
    );

    router.post(
      "/api/sessionLogout",
      eventHandler((event) => {
        deleteCookie(event, "__session");
        setResponseStatus(event, 200, "Logged Out");
        return "Logged Out";
      }),
    );
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
    router.post(
      "/_telefunc",
      eventHandler(async (event) => {
        const request = toWebRequest(event);
        const httpResponse = await telefunc({
          url: request.url.toString(),
          method: request.method,
          body: await request.text(),
          context: event,
        });
        const { body, statusCode, contentType } = httpResponse;

        setResponseStatus(event, statusCode);
        setResponseHeaders(event, {
          "content-type": contentType,
        });

        return body;
      }),
    );
  }

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  router.use(
    "/**",
    eventHandler(async (event) => {
      const pageContextInit = BATI.has("firebase-auth")
        ? {
            urlOriginal: event.node.req.originalUrl || event.node.req.url!,
            user: event.context.user,
          }
        : { urlOriginal: event.node.req.originalUrl || event.node.req.url! };
      const pageContext = await renderPage(pageContextInit);
      const response = pageContext.httpResponse;

      setResponseStatus(event, response?.statusCode);
      setResponseHeaders(event, Object.fromEntries(response?.headers ?? []));

      return response?.getBody();
    }),
  );

  app.use(router);

  const server = createServer(toNodeListener(app)).listen(process.env.PORT || 3000);

  server.on("listening", () => {
    console.log(`Server listening on http://localhost:${process.env.PORT || 3000}`);
  });
}
