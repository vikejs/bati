import type { Session, User } from "lucia";
import { generateId, Scrypt, verifyRequestOrigin } from "lucia";
import type { DatabaseOAuthAccount, DatabaseUser, GitHubUser } from "../lib/lucia-auth";
import { github, lucia } from "../lib/lucia-auth";
import { SqliteError } from "better-sqlite3";
import { generateState, OAuth2RequestError } from "arctic";
import { parse, serialize } from "cookie";
import * as drizzleQueries from "@batijs/drizzle/database/drizzle/queries/lucia-auth";
import * as sqliteQueries from "@batijs/sqlite/database/sqlite/queries/lucia-auth";
import type { Get, UniversalHandler, UniversalMiddleware } from "@universal-middleware/core";

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
export const luciaAuthContextMiddleware = (() => async (request, context) => {
  const sessionId = lucia.readSessionCookie(request.headers.get("cookie") ?? "");

  if (!sessionId) {
    return {
      ...context,
      session: null,
      user: null,
    };
  } else {
    const { session, user } = await lucia.validateSession(sessionId);

    return {
      ...context,
      sessionId,
      session,
      user,
    };
  }
}) satisfies Get<[], UniversalMiddleware>;

/**
 * Set Set-Cookie headers if in context
 */
export const luciaAuthCookieMiddleware = (() => (_request, context) => {
  return (response: Response) => {
    if (context.session?.fresh) {
      response.headers.append("Set-Cookie", lucia.createSessionCookie(context.session.id).serialize());
    }
    if (context.sessionId && !context.session) {
      response.headers.append("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    }

    return response;
  };
}) satisfies Get<[], UniversalMiddleware<{ session?: Session | null; user?: User | null; sessionId?: string | null }>>;

/**
 * Register user handler
 *
 * @link {@see https://lucia-auth.com/guides/email-and-password/basics#register-user}
 */
export const luciaAuthSignupHandler = (() => async (request) => {
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
    (BATI.has("drizzle") ? drizzleQueries : sqliteQueries).signupWithCredentials(userId, username, passwordHash);

    const session = await lucia.createSession(userId, {});

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": lucia.createSessionCookie(session.id).serialize(),
      },
    });
  } catch (error) {
    if (error instanceof SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return new Response(JSON.stringify({ error: { username: "Username already in use" } }), {
        status: 422,
        headers: {
          "content-type": "application/json",
        },
      });
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
export const luciaAuthLoginHandler = (() => async (request) => {
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

  const existingUser = (BATI.has("drizzle") ? drizzleQueries : sqliteQueries).getExistingUser(username) as
    | DatabaseUser
    | undefined;
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

  const session = await lucia.createSession(existingUser.id, {});

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": lucia.createSessionCookie(session.id).serialize(),
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
  await lucia.invalidateSession(session.id);

  /**
   * Delete session cookie
   *
   * @link {@see https://lucia-auth.com/basics/sessions#delete-session-cookie}
   */
  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: {
      "set-cookie": lucia.createBlankSessionCookie().serialize(),
    },
  });
}) satisfies Get<[], UniversalMiddleware<{ session?: Session | null }>>;

/**
 * Github OAuth authorization handler
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#creating-authorization-url}
 */
export const luciaGithubLoginHandler = (() => async () => {
  const state = generateState();
  const url = await github.createAuthorizationURL(state);

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
export const luciaGithubCallbackHandler = (() => async (request) => {
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

    const existingAccount = (BATI.has("drizzle") ? drizzleQueries : sqliteQueries).getExistingAccount(
      "github",
      githubUser.id,
    ) as DatabaseOAuthAccount | undefined;

    if (existingAccount) {
      const session = await lucia.createSession(
        BATI.has("drizzle") ? existingAccount.userId : existingAccount.user_id,
        {},
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "set-cookie": lucia.createSessionCookie(session.id).serialize(),
        },
      });
    }

    const userId = generateId(15);

    (BATI.has("drizzle") ? drizzleQueries : sqliteQueries).signupWithGithub(userId, githubUser.login, githubUser.id);

    const session = await lucia.createSession(userId, {});

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "set-cookie": lucia.createSessionCookie(session.id).serialize(),
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
