import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeReact from "vike-react/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

const config: Config = {
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

  //# BATI.has("vercel")
  prerender: true,
};

export default config;
