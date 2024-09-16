import { parse, serialize } from "cookie";
import { getAuth } from "firebase-admin/auth";
import { firebaseAdmin } from "../libs/firebaseAdmin";
// TODO: stop using universal-middleware and directly integrate server middlewares instead. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import type { Get, UniversalHandler, UniversalMiddleware } from "@universal-middleware/core";

export const firebaseAuthMiddleware: Get<[], UniversalMiddleware> = () => async (request, context) => {
  if (!request.headers.has("cookie")) return;

  const cookies = parse(request.headers.get("cookie")!);
  const sessionCookie: string = cookies.__session || "";

  try {
    const auth = getAuth(firebaseAdmin);
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    const user = await auth.getUser(decodedIdToken.sub);
    return {
      ...context,
      user,
    };
  } catch (error) {
    console.debug("verifySessionCookie:", error);
    return {
      ...context,
      user: null,
    };
  }
};

export const firebaseAuthLoginHandler: Get<[], UniversalHandler> = () => async (request) => {
  const body = await request.json();
  const idToken: string = (body as { idToken?: string }).idToken || "";

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await getAuth(firebaseAdmin).createSessionCookie(idToken, { expiresIn });

    const options = { maxAge: expiresIn / 1000, httpOnly: true, secure: true, path: "/" };

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
};

export const firebaseAuthLogoutHandler: Get<[], UniversalHandler> = () => async () => {
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
};
