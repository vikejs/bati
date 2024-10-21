import type { Session, User } from "lucia";
import { generateId, Scrypt, verifyRequestOrigin } from "lucia";
import {
  type DatabaseOAuthAccount,
  type DatabaseUser,
  github,
  type GitHubUser,
  initializeLucia,
} from "../lib/lucia-auth";
import { SqliteError } from "better-sqlite3";
import { generateState, OAuth2RequestError } from "arctic";
import { parse, serialize } from "cookie";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/lucia-auth";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/lucia-auth";
import * as d1Queries from "@batijs/d1-sqlite/database/d1/queries/lucia-auth";
// TODO: stop using universal-middleware and directly integrate server middlewares instead. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import { type Get, type UniversalHandler, type UniversalMiddleware } from "@universal-middleware/core";

/**
 * Add lucia database to the context
 *
 * @link {@see https://universal-middleware.dev/examples/context-middleware}
 */
export const luciaDbMiddleware: Get<[], UniversalMiddleware> = () => async (_request, context, _runtime) => {
  const lucia = initializeLucia(context.db);
  return {
    ...context,
    lucia,
  };
};

/**
 * CSRF protection middleware
 *
 * @link {@see https://lucia-auth.com/guides/validate-session-cookies/}
 */
export const luciaCsrfMiddleware = (() => async (request) => {
  if (request.method === "GET") {
    return;
  }
  if (!BATI_TEST) {
    const originHeader = request.headers.get("Origin") ?? null;
    const hostHeader = request.headers.get("Host") ?? null;

    if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
      return new Response("Forbidden Request", {
        status: 403,
      });
    }
  }
}) satisfies Get<[], UniversalMiddleware>;

/**
 * Validate session cookies middleware and set context
 *
 * @link {@see https://lucia-auth.com/guides/validate-session-cookies/}
 */
export const luciaAuthContextMiddleware: Get<[], UniversalMiddleware> = () => async (request, context) => {
  const sessionId = context.lucia.readSessionCookie(request.headers.get("cookie") ?? "");

  if (!sessionId) {
    return {
      ...context,
      session: null,
      user: null,
    };
  } else {
    const { session, user } = await context.lucia.validateSession(sessionId);

    return {
      ...context,
      sessionId,
      session,
      user,
    };
  }
};

/**
 * Set Set-Cookie headers if in context
 */
export const luciaAuthCookieMiddleware = (() => (_request, context) => {
  return (response: Response) => {
    if (context.session?.fresh) {
      response.headers.append("Set-Cookie", context.lucia.createSessionCookie(context.session.id).serialize());
    }
    if (context.sessionId && !context.session) {
      response.headers.append("Set-Cookie", context.lucia.createBlankSessionCookie().serialize());
    }

    return response;
  };
}) satisfies Get<
  [],
  UniversalMiddleware<Universal.Context & { session?: Session | null; user?: User | null; sessionId?: string | null }>
>;

/**
 * Register user handler
 *
 * @link {@see https://lucia-auth.com/guides/email-and-password/basics#register-user}
 */
export const luciaAuthSignupHandler = (() => async (request, context, _runtime) => {
  const body = (await request.json()) as { username: string; password: string };
  const username = body.username ?? "";
  const password = body.password ?? "";

  const validated = validateInput(username, password);

  if (!validated.success) {
    return new Response(JSON.stringify({ error: validated.error }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  /**
   * A pure JS implementation of Scrypt.
   * It's portable but slower than implementations based on native code.
   *
   * @link {@see https://lucia-auth.com/reference/main/Scrypt}
   * @link {@see https://lucia-auth.com/guides/email-and-password/basics#hashing-passwords}
   */
  const scrypt = new Scrypt();
  const passwordHash = await scrypt.hash(password);

  const userId = generateId(15);

  try {
    if (BATI.has("drizzle")) {
      await drizzleQueries.signupWithCredentials(context.db, userId, username, passwordHash);
    } else if (BATI.has("sqlite") && !BATI.hasD1) {
      sqliteQueries.signupWithCredentials(context.db, userId, username, passwordHash);
    } else if (BATI.hasD1) {
      await d1Queries.signupWithCredentials(context.db, userId, username, passwordHash);
    }

    const session = await context.lucia.createSession(userId, {});

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": context.lucia.createSessionCookie(session.id).serialize(),
      },
    });
  } catch (error) {
    console.error(error);
    if (BATI.has("sqlite") && !BATI.hasD1) {
      if (error instanceof SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return new Response(JSON.stringify({ error: { username: "Username already in use" } }), {
          status: 422,
          headers: {
            "content-type": "application/json",
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: { invalid: "An unknown error has occurred" } }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}) satisfies Get<[], UniversalMiddleware>;

/**
 * Sign in user handler
 *
 * @link {@see https://lucia-auth.com/guides/email-and-password/basics#sign-in-user}
 */
export const luciaAuthLoginHandler = (() => async (request, context, _runtime) => {
  const body = (await request.json()) as { username: string; password: string };
  const username = body.username ?? "";
  const password = body.password ?? "";

  const validated = validateInput(username, password);

  if (!validated.success) {
    return new Response(JSON.stringify({ error: validated.error }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const existingUser: DatabaseUser | undefined | null = BATI.has("drizzle")
    ? await drizzleQueries.getExistingUser(context.db, username)
    : BATI.has("sqlite") && !BATI.hasD1
      ? sqliteQueries.getExistingUser<DatabaseUser>(context.db, username)
      : BATI.hasD1
        ? await d1Queries.getExistingUser<DatabaseUser>(context.db, username)
        : undefined;

  if (!existingUser) {
    return new Response(JSON.stringify({ error: { invalid: "Incorrect username or password" } }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const scrypt = new Scrypt();
  const validPassword = existingUser.password && (await scrypt.verify(existingUser.password, password));

  if (!validPassword) {
    return new Response(JSON.stringify({ error: { invalid: "Incorrect username or password" } }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const session = await context.lucia.createSession(existingUser.id, {});

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": context.lucia.createSessionCookie(session.id).serialize(),
    },
  });
}) satisfies Get<[], UniversalMiddleware>;

/**
 * Log out user handler
 */
export const luciaAuthLogoutHandler = (() => async (_request, context) => {
  const session = context.session ?? null;

  if (!session) {
    return new Response("Unauthorized Request", {
      status: 401,
    });
  }
  /**
   * Invalidate sessions
   *
   * @link {@see https://lucia-auth.com/basics/sessions#invalidate-sessions}
   */
  await context.lucia.invalidateSession(session.id);

  /**
   * Delete session cookie
   *
   * @link {@see https://lucia-auth.com/basics/sessions#delete-session-cookie}
   */
  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: {
      "set-cookie": context.lucia.createBlankSessionCookie().serialize(),
    },
  });
}) satisfies Get<[], UniversalMiddleware<Universal.Context & { session?: Session | null }>>;

/**
 * Github OAuth authorization handler
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#creating-authorization-url}
 */
export const luciaGithubLoginHandler = (() => async () => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["user:email"]);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "set-cookie": serialize("github_oauth_state", state, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax",
      }),
    },
  });
}) satisfies Get<[], UniversalHandler>;

/**
 * Github OAuth validate callback handler
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#validate-callback}
 */
export const luciaGithubCallbackHandler = (() => async (request, context, _runtime) => {
  const cookies = parse(request.headers.get("cookie") ?? "");
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const storedState = cookies.github_oauth_state ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response("Unauthorized Request", {
      status: 401,
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser = (await githubUserResponse.json()) as GitHubUser;

    const existingAccount: DatabaseOAuthAccount | undefined | null = BATI.has("drizzle")
      ? ((await drizzleQueries.getExistingAccount(context.db, "github", githubUser.id)) as
          | DatabaseOAuthAccount
          | undefined)
      : BATI.has("sqlite") && !BATI.hasD1
        ? sqliteQueries.getExistingAccount<DatabaseOAuthAccount>(context.db, "github", githubUser.id)
        : BATI.hasD1
          ? await d1Queries.getExistingAccount<DatabaseOAuthAccount>(context.db, "github", githubUser.id)
          : undefined;

    if (existingAccount) {
      const session = await context.lucia.createSession(
        BATI.has("drizzle") ? existingAccount.userId : existingAccount.user_id,
        {},
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "set-cookie": context.lucia.createSessionCookie(session.id).serialize(),
        },
      });
    }

    const userId = generateId(15);

    if (BATI.has("drizzle")) {
      await drizzleQueries.signupWithGithub(context.db, userId, githubUser.login, githubUser.id);
    } else if (BATI.has("sqlite") && !BATI.hasD1) {
      sqliteQueries.signupWithGithub(context.db, userId, githubUser.login, githubUser.id);
    } else if (BATI.hasD1) {
      await d1Queries.signupWithGithub(context.db, userId, githubUser.login, githubUser.id);
    }

    const session = await context.lucia.createSession(userId, {});

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "set-cookie": context.lucia.createSessionCookie(session.id).serialize(),
      },
    });
  } catch (error) {
    if (error instanceof OAuth2RequestError && error.message === "bad_verification_code") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}) satisfies Get<[], UniversalHandler>;

export function validateInput(username: string | null, password: string | null) {
  const error: {
    username: string | null;
    password: string | null;
  } = {
    username: null,
    password: null,
  };

  if (!username || username.length < 3 || username.length > 31 || !/^[a-z0-9_-]+$/.test(username)) {
    error.username = "Invalid username";
  }
  if (!password || password.length < 6 || password.length > 255) {
    error.password = "Invalid password";
  }

  if (error.username || error.password) {
    return {
      error,
      success: false,
    };
  }
  return {
    error,
    success: true,
  };
}
