import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

const config: Config = {
  // https://vike.dev/head-tags
  title: "My Vike App",
  description: "Demo showcasing Vike",

  //# BATI.has("auth0") || BATI.has("authjs") || BATI.has("better-auth")
  passToClient: ["user"],
  extends: [vikeReact],

  //# BATI.has("vercel")
  prerender: true,

  //# BATI.hasUD && !BATI.hasServer
  // https://vike.dev/server
  server: true,
};

export default config;
