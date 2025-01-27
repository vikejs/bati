import { resolve } from "node:path";
import autoprefixer from "autoprefixer";
import vikeSolid from "vike-solid/vite";
import vike from "vike/plugin";
import tailwindcss from "@tailwindcss/vite";
import { build, defineConfig, type Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";

const writeToDisk: () => Plugin = () => {
  let building = false;
  return {
    name: "write-to-disk",
    apply: "serve",
    handleHotUpdate: async ({ file, server }) => {
      if (building) return;
      building = true;

      server.config.logger.info(`${file} updated. Rebuilding Web Component`, {
        timestamp: true,
      });

      await build({
        mode: "widget",
        configFile: "./vite.config.ts",
      });

      building = false;
    },
  };
};

export default defineConfig(({ mode, command }) => {
  const alias = {
    "#components": resolve(__dirname, "components"),
    "#assets": resolve(__dirname, "assets"),
    "#layouts": resolve(__dirname, "layouts"),
  };

  if (mode === "widget") {
    return {
      resolve: {
        alias,
      },
      build: {
        lib: {
          entry: "pages/index/Index.element.ts",
          formats: ["es"],
          fileName: "full",
        },
        outDir: "dist/elements",
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
      server: {
        watch: {
          ignored: ["dist/**"],
        },
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
      css: {
        postcss: {
          inject: false,
          plugins: [
            autoprefixer(),
            {
              postcssPlugin: "fix-css-wc-scope",
              Rule(rule) {
                rule.selector = rule.selector.replaceAll(":root", ".bati-widget");
              },
            },
          ],
        },
      },
      plugins: [solidPlugin(), tailwindcss(), command === "serve" ? writeToDisk() : undefined],
    };
  }

  return {
    base: process.env.BASE ?? undefined,
    resolve: {
      alias,
    },
    plugins: [
      vike({
        prerender: true,
      }),
      vikeSolid(),
      tailwindcss(),
    ],
  };
});
