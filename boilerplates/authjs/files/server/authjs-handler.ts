import { env as cloudflareEnv } from "cloudflare:workers";
import { Auth, type AuthConfig, createActionURL, setEnvDefaults } from "@auth/core";
import Auth0 from "@auth/core/providers/auth0";
import CredentialsProvider from "@auth/core/providers/credentials";
import type { Session } from "@auth/core/types";
import { enhance, type UniversalHandler, type UniversalMiddleware } from "@universal-middleware/core";

//# BATI.has("auth0")
const env: Record<string, string | undefined> = BATI.has("cloudflare")
  ? (cloudflareEnv as Record<string, string | undefined>)
  : typeof process?.env !== "undefined"
    ? process.env
    : import.meta && "env" in import.meta
      ? (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
      : {};

const authjsConfig = {
  basePath: "/api/auth",
  trustHost: true,
  // TODO: Replace secret {@see https://authjs.dev/reference/core#secret}
  secret: "MY_SECRET",
  providers: [
    // TODO: Choose and implement providers
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
    //# BATI.has("auth0")
    Auth0({
      issuer: env.AUTH0_ISSUER_BASE_URL,
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
    }),
  ],
} satisfies Omit<AuthConfig, "raw">;

/**
 * Retrieve Auth.js session from Request
 */
export async function getSession(req: Request, config: Omit<AuthConfig, "raw">): Promise<Session | null> {
  setEnvDefaults(process.env, config);
  const requestURL = new URL(req.url);
  const url = createActionURL("session", requestURL.protocol, req.headers, process.env, config);

  const response = await Auth(new Request(url, { headers: { cookie: req.headers.get("cookie") ?? "" } }), config);

  const { status = 200 } = response;

  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data as Session;
  throw new Error(typeof data === "object" && "message" in data ? (data.message as string) : undefined);
}

/**
 * Add Auth.js session to context
 * @link {@see https://authjs.dev/getting-started/session-management/get-session}
 **/
export const authjsSessionMiddleware: UniversalMiddleware = enhance(
  async (request, context) => {
    try {
      return {
        ...context,
        session: await getSession(request, authjsConfig),
      };
    } catch (error) {
      console.debug("authjsSessionMiddleware:", error);
      return {
        ...context,
        session: null,
      };
    }
  },
  {
    name: "my-app:authjs-middleware",
    immutable: false,
  },
);

/**
 * Auth.js route
 * @link {@see https://authjs.dev/getting-started/installation}
 **/
export const authjsHandler = enhance(
  async (request) => {
    return Auth(request, authjsConfig);
  },
  {
    name: "my-app:authjs-handler",
    path: "/api/auth/**",
    method: ["GET", "POST"],
    immutable: false,
  },
) satisfies UniversalHandler;
