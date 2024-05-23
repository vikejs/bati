import { Auth } from "@auth/core";
import CredentialsProvider from "@auth/core/providers/credentials";

const env: Record<string, string | undefined> =
  typeof process?.env !== "undefined"
    ? process.env
    : import.meta && "env" in import.meta
      ? (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
      : {};

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: await import("node:crypto").then((crypto) => crypto.webcrypto as Crypto),
    writable: false,
    configurable: true,
  });
}

/**
 * AuthJS
 *
 * TODO: Replace secret {@see https://authjs.dev/reference/core#secret}
 * TODO: Choose and implement providers
 *
 * @link {@see https://authjs.dev/guides/providers/custom-provider}
 **/
export function authjsHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): Promise<Response> {
  return Auth(request, {
    basePath: "/api/auth",
    trustHost: Boolean(env.AUTH_TRUST_HOST ?? env.VERCEL ?? env.NODE_ENV !== "production"),
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
}
