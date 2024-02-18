import vikeSolid from "vike-solid/config";
import type { Config } from "vike/types";
import Head from "../layouts/HeadDefault";
import Layout from "../layouts/LayoutDefault";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  // <title>
  /*{ @if (it.BATI.has("firebase-auth")) }*/
  passToClient: ["user"],
  /*{ /if }*/
  title: "My Vike App",
  extends: vikeSolid,
} satisfies Config;
