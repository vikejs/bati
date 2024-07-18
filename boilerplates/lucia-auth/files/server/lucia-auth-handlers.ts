import { generateId, verifyRequestOrigin, Scrypt, type Session } from "lucia";
import { github, lucia, type DatabaseUser } from "../lib/lucia-auth";
import { SqliteError } from "better-sqlite3";
import { sqliteDb } from "../database/sqliteDb";
import { OAuth2RequestError, generateState } from "arctic";
import { parse, serialize } from "cookie";
import { drizzleDb } from "@batijs/drizzle/database/drizzleDb";
import { userTable, oauthAccountTable } from "../database/schema/auth";
import { getExistingUser, getExistingAccount } from "../database/auth-actions";

/**
 * CSRF protection middleware
 *
 * @link {@see https://lucia-auth.com/guides/validate-session-cookies/}
 */
export function luciaCsrfMiddleware<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): void | Response {
  if (request.method === "GET") {
    return;
  }
  const originHeader = request.headers.get("Origin") ?? null;
  const hostHeader = request.headers.get("Host") ?? null;

  if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
    return new Response(null, {
      status: 403,
    });
  }
}

/**
 * Validate session cookies middleware
 *
 * @link {@see https://lucia-auth.com/guides/validate-session-cookies/}
 */
export async function luciaAuthMiddleware(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
): Promise<void> {
  const sessionId = lucia.readSessionCookie(request.headers.get("cookie") ?? "");

  if (!sessionId) {
    context.user = null;
    context.session = null;
  } else {
    const { session, user } = await lucia.validateSession(sessionId);

    if (session && session.fresh) {
      request.headers.append("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    }
    if (!session) {
      request.headers.append("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    }

    context.session = session;
    context.user = user;
  }
}

/**
 * Register user handler
 *
 * @link {@see https://lucia-auth.com/guides/email-and-password/basics#register-user}
 */
export async function luciaAuthSignupHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): Promise<Response> {
  const body = (await request.json()) as { username: string; password: string };
  const username = body.username || null;
  const password = body.password || null;

  if (!username || username.length < 3 || username.length > 31 || !/^[a-z0-9_-]+$/.test(username)) {
    return new Response(JSON.stringify({ errors: { username: "Invalid username" } }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }
  if (!password || password.length < 6 || password.length > 255) {
    return new Response(JSON.stringify({ errors: { password: "Invalid password" } }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  /**
   * A pure JS implementation of Scrypt.
   * It's slower than implementations based on native code.
   *
   * @link {@see https://lucia-auth.com/reference/main/Scrypt}
   * @link {@see https://lucia-auth.com/guides/email-and-password/basics#hashing-passwords}
   */
  const scrypt = new Scrypt();
  const passwordHash = await scrypt.hash(password);

  const userId = generateId(15);

  try {
    if (BATI.has("drizzle")) {
      drizzleDb.insert(userTable).values({ id: userId, username, passwordHash }).run();
    } else {
      sqliteDb
        .prepare("INSERT INTO users (id, username, password_hash) VALUES(?, ?, ?)")
        .run(userId, username, passwordHash);
    }

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
      return new Response(JSON.stringify({ errors: { username: "Username already used" } }), {
        status: 422,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ error: "An unknown error occurred" }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}

/**
 * Sign in user handler
 *
 * @link {@see https://lucia-auth.com/guides/email-and-password/basics#sign-in-user}
 */
export async function luciaAuthLoginHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context: Context,
): Promise<Response> {
  const body = (await request.json()) as { username: string; password: string };
  const username = body.username || null;
  const password = body.password || null;

  if (!username || username.length < 3 || username.length > 31 || !/^[a-z0-9_-]+$/.test(username)) {
    return new Response(JSON.stringify({ errors: { username: "Invalid username" } }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }
  if (!password || password.length < 6 || password.length > 255) {
    return new Response(JSON.stringify({ errors: { password: "Invalid password" } }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const existingUser = getExistingUser(username) as DatabaseUser | undefined;
  if (!existingUser) {
    return new Response(JSON.stringify({ error: "Incorrect username or password" }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const scrypt = new Scrypt();
  const validPassword = existingUser.password_hash && (await scrypt.verify(existingUser.password_hash, password));

  if (!validPassword) {
    return new Response(JSON.stringify({ error: "Incorrect username or password" }), {
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
}

/**
 * Log out user handler
 */
export async function luciaAuthLogoutHandler<Context extends Record<string | number | symbol, unknown>>(
  _request: Request,
  context: Context & { session: Session },
): Promise<Response> {
  const { session } = context;

  if (!session) {
    return new Response(null, {
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
  return new Response(null, {
    status: 301,
    headers: {
      Location: "/login",
      "set-cookie": lucia.createBlankSessionCookie().serialize(),
    },
  });
}

/**
 * Github OAuth authorization handler
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#creating-authorization-url}
 */
export async function luciaGithubLoginHandler<Context extends Record<string | number | symbol, unknown>>(
  _request: Request,
  _context: Context,
): Promise<Response> {
  const state = generateState();
  const url = await github.createAuthorizationURL(state);

  return new Response(null, {
    status: 301,
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
}

/**
 * Github OAuth validate callback handler
 *
 * @link {@see https://lucia-auth.com/guides/oauth/basics#validate-callback}
 */
export async function luciaGithubCallbackHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context: Context,
): Promise<Response> {
  const cookies = parse(request.headers.get("cookie") || "");
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const storedState = cookies.github_oauth_state || null;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
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

    const existingAccount = getExistingAccount("github", githubUser.id) as DatabaseUser | undefined;

    if (existingAccount) {
      const session = await lucia.createSession(existingAccount.id, {});
      return new Response(JSON.stringify({ status: "success" }), {
        status: 301,
        headers: {
          Location: "/",
          "set-cookie": lucia.createSessionCookie(session.id).serialize(),
        },
      });
    }
    const userId = generateId(15);

    if (BATI.has("drizzle")) {
      drizzleDb.insert(userTable).values({ id: userId, username: githubUser.login }).run();
      drizzleDb.insert(oauthAccountTable).values({ providerId: "github", providerUserId: githubUser.id, userId }).run();
    } else {
      sqliteDb.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run(userId, githubUser.login);
      sqliteDb
        .prepare("INSERT INTO oauth_accounts (provider_id, provider_user_id, user_id) VALUES (?, ?, ?)")
        .run("github", githubUser.id, userId);
    }

    const session = await lucia.createSession(userId, {});

    return new Response(JSON.stringify({ status: "success" }), {
      status: 301,
      headers: {
        Location: "/",
        "set-cookie": lucia.createSessionCookie(session.id).serialize(),
      },
    });
  } catch (error) {
    if (error instanceof OAuth2RequestError && error.message === "bad_verification_code") {
      // invalid code
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
}

interface GitHubUser {
  id: string;
  login: string;
}
