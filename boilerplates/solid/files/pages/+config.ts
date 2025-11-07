import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeSolid from "vike-solid/config";
import Layout from "../layouts/Layout.js";

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
    vikeSolid,
    //# BATI.hasPhoton
    vikePhoton,
  ],

  //# BATI.hasServer
  // https://vike.dev/vike-photon
  photon: {
    server: "../server/entry.ts",
  },
} satisfies Config;
