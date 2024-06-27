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
  extends: vikeReact,
} satisfies Config;
