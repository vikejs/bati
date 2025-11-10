import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeVue from "vike-vue/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "My Vike App",
  description: "Demo showcasing Vike",

  //# BATI.has("auth0") || BATI.has("authjs")
  passToClient: ["user"],
  extends: [
    vikeVue,
    //# BATI.hasPhoton
    vikePhoton,
  ],

  //# BATI.hasServer
  // https://vike.dev/vike-photon
  photon: {
    server: "../server/entry.ts",
  },
} as Config;
