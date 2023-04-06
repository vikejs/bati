import ssr from "vite-plugin-ssr/plugin";
import { type PluginOption, defineConfig } from "vite";

let Framework: Promise<PluginOption> | undefined = undefined;

if (import.meta.VIKE_FRAMEWORK === "react") {
  Framework = import("@vitejs/plugin-react").then((x) => x.default());
} else if (import.meta.VIKE_FRAMEWORK === "solid") {
  Framework = import("vite-plugin-solid").then((x) => x.default());
}

export default defineConfig({
  plugins: [Framework, ssr()],
});
