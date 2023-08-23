import type { Config } from "vike-vue/types";
import Layout from "../layouts/LayoutDefault.vue";
import Head from "../layouts/HeadDefault.vue";
import logoUrl from "../assets/logo.svg";
import vikeVue from "vike-vue";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  // <title>
  title: "My Vike App",
  // <meta name="description">
  description: "Demo showcasing Vike",
  // <link rel="icon" href="${favicon}" />
  favicon: logoUrl,
  extends: vikeVue,
} satisfies Config;
