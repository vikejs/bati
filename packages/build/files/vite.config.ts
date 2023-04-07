import ssr from "vite-plugin-ssr/plugin";
import react from "@vitejs/plugin-react";
import solid from "vite-plugin-solid";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    import.meta.VIKE_FRAMEWORK === "react"
      ? react()
      : import.meta.VIKE_FRAMEWORK === "solid"
      ? solid()
      : import.meta.VIKE_REMOVE,
    ssr(),
  ],
});
