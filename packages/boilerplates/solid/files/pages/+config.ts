import type { Config } from "solide";
import Layout from "../layouts/LayoutDefault";

// Default config (can be overriden by pages)
export default {
  Layout,
  // <title>
  title: "My Solide App",
  // <meta name="description">
  description: "Demo showcasing Solide",
} satisfies Config;
