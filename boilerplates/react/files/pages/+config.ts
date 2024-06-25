import vikeReact from "vike-react/config";
import type { Config } from "vike/types";
import Head from "../layouts/HeadDefault.js";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  //# BATI.has("auth0") || BATI.has("firebase-auth") || BATI.has("authjs")
  passToClient: ["user"],
  // <title>
  title: "My Vike App",
  stream:
    BATI.has("express") || BATI.has("fastify") || BATI.has("h3") || BATI.has("hattip") || BATI.has("hono")
      ? "web"
      : true,
  extends: vikeReact,
  //# BATI.has("firebase-auth")
  meta: {
    // Temporary workaround until +client.js is implemented: https://github.com/vikejs/vike/issues/1468
    firebaseApp: {
      env: { client: true },
    },
  },
} satisfies Config;
