import { createRouter } from "@hattip/router";
import { renderPage } from "vite-plugin-ssr/server";
import { telefunc } from "telefunc";
import { VikeAuth } from "vike-authjs";
import CredentialsProvider from "@auth/core/providers/credentials";

const router = createRouter();

if (import.meta.BATI_MODULES?.includes("rpc:telefunc")) {
  /**
   * Telefunc route
   *
   * @link {@see https://telefunc.com}
   **/
  router.post("/_telefunc", async (context) => {
    const httpResponse = await telefunc({
      url: context.url.toString(),
      method: context.method,
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
  });
}

if (import.meta.BATI_MODULES?.includes("auth:authjs")) {
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
        async authorize(credentials, req) {
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
 * @link {@see https://vite-plugin-ssr.com}
 **/
router.use(async (context) => {
  const pageContextInit = { urlOriginal: context.request.url };
  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  return new Response(await response?.getBody(), {
    status: response?.statusCode,
    headers: response
      ? {
          "content-type": response.contentType,
        }
      : {},
  });
});

export default router.buildHandler();
