import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeReact from "vike-react/config";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout,

  // https://vike.dev/head-tags
  title: "My Vike App",
  description: "Demo showcasing Vike",

  //# BATI.has("auth0") || BATI.has("authjs")
  passToClient: ["user"],
  extends: [
    vikeReact,
    //# BATI.hasPhoton
    vikePhoton,
  ],

  //# BATI.hasServer
  // https://vike.dev/vike-photon
  photon: {
    server: "../server/entry.ts",
  },
} satisfies Config;
