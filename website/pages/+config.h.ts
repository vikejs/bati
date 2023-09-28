import faviconUrl from "#assets/logo.svg";
import vikeSolid from "vike-solid";
import type { Config } from "vike/types";
import Head from "../layouts/Head";
import Layout from "../layouts/LayoutDefault";

// Default config (can be overriden by pages)
export default {
  prerender: true,
  Layout: Layout,
  Head: Head,
  // <title>
  title: "Bati",
  favicon: faviconUrl,
  // <meta name="description">
  description: "Bati",
  extends: vikeSolid,
} satisfies Config;
