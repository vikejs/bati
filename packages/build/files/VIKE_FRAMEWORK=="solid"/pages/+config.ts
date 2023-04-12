import type { Config } from "solide";
import Layout from "../layouts/LayoutDefault";

// Default config (can be overriden by pages)
export default {
  Layout,
  // <title>
  title: "My Solide App",
  // <meta name="description">
  description: "Demo showcasing Solide",
};
/**
 * Not supported by ast-types yet
 * @see {@link https://github.com/benjamn/ast-types/issues/935}
 */
// } satisfies Config;
