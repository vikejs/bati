import vikeSolid, { type UserConfig } from "vike-solid";
import Layout from "../layouts/LayoutDefault";
import Head from "../layouts/HeadDefault";

// Default config (can be overriden by pages)
export default {
  Layout,
  Head,
  // <title>
  title: "My Vike App",
  // <meta name="description">
  description: "Demo showcasing Vike",
  extends: vikeSolid,
} satisfies UserConfig;
