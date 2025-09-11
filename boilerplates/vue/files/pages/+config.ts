import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeVercel from "vike-vercel/config";
import vikeVue from "vike-vue/config";
import Layout from "../layouts/LayoutDefault.vue";

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
    vikeVue,
    //# BATI.hasPhoton && !BATI.has("vercel")
    vikePhoton,
    //# BATI.has("vercel")
    vikeVercel,
  ] as BATI.Any,
} satisfies Config;
