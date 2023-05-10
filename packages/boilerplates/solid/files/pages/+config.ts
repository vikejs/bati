import type { Config } from "vike-solid";
import Layout from "../layouts/LayoutDefault";

// Default config (can be overriden by pages)
export default {
  Layout,
  // <title>
  title: "My Vike App",
  // <meta name="description">
  description: "Demo showcasing Vike",
} satisfies Config;
