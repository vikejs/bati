import vikeVue from "vike-vue/config";
import type { Config } from "vike/types";
import Head from "../layouts/HeadDefault.vue";
import Layout from "../layouts/LayoutDefault.vue";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  // <title>
  /*{ @if (it.BATI.has("firebase-auth")) }*/
  passToClient: ["user"],
  /*{ /if }*/
  title: "My Vike App",
  extends: vikeVue,
  /*{ @if (it.BATI.has("firebase-auth")) }*/
  meta: {
    // Temporary workaround until +client.js is implemented: https://github.com/vikejs/vike/issues/1468
    firebaseApp: {
      env: { client: true },
    },
  },
  /*{ /if }*/
} satisfies Config;
