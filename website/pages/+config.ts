import faviconUrl from "#assets/logo.svg";
import vikeSolid from "vike-solid/config";
import type { Config } from "vike/types";
import Head from "../layouts/Head.js";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overriden by pages)
export default {
  prerender: true,
  Layout: Layout,
  Head: Head,
  favicon: faviconUrl,
  extends: vikeSolid,
} satisfies Config;
