import { parse, serialize } from "cookie";
import { getAuth } from "firebase-admin/auth";
import { firebaseAdmin } from "../libs/firebaseAdmin";

export async function firebaseAuthMiddleware(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
): Promise<void> {
  if (!request.headers.has("cookie")) return;

  const cookies = parse(request.headers.get("cookie")!);
  const sessionCookie: string = cookies.__session || "";

  try {
    const auth = getAuth(firebaseAdmin);
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    context.user = await auth.getUser(decodedIdToken.sub);
  } catch (error) {
    console.debug("verifySessionCookie:", error);
    context.user = null;
  }
}

export async function firebaseAuthLoginHandler<Context extends Record<string | number | symbol, unknown>>(
  request: Request,
  _context?: Context,
): Promise<Response> {
  const body = await request.json();
  const idToken: string = (body as { idToken?: string }).idToken || "";

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await getAuth(firebaseAdmin).createSessionCookie(idToken, { expiresIn });

    const options = { maxAge: expiresIn / 1000, httpOnly: true, secure: true };

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": serialize("__session", sessionCookie, options),
      },
    });
  } catch (error) {
    console.error("createSessionCookie:", error);

    return new Response("Unauthorized Request", {
      status: 401,
    });
  }
}

export async function firebaseAuthLogoutHandler<Context extends Record<string | number | symbol, unknown>>(
  _request: Request,
  _context?: Context,
): Promise<Response> {
  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": serialize("__session", "", {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        expires: new Date(1),
        path: "/",
      }),
    },
  });
}
