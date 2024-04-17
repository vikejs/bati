import vikeReact from "vike-react/config";
import type { Config } from "vike/types";
import Head from "../layouts/HeadDefault.js";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  /*{ @if (it.BATI.has("auth0") || it.BATI.has("firebase-auth")) }*/
  passToClient: ["user"],
  /*{ /if }*/
  // <title>
  title: "My Vike App",
  extends: vikeReact,
  /*{ @if (it.BATI.has("firebase-auth")) }*/
  meta: {
    // Temporary workaround until +client.js is implemented: https://github.com/vikejs/vike/issues/1468
    firebaseApp: {
      env: { client: true },
    },
  },
  /*{ /if }*/
} satisfies Config;
