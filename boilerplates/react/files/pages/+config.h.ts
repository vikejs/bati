import vikeReact from "vike-react";
import type { Config } from "vike/types";
import Head from "../layouts/HeadDefault";
import Layout from "../layouts/LayoutDefault";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  // <title>
  title: "My Vike App",
  extends: vikeReact,
} satisfies Config;
