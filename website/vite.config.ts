import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import vike from "vike/plugin";
import vikeSolid from "vike-solid/vite";
import { build, defineConfig, type Plugin } from "vite";
import viteSolidPlugin from "vite-plugin-solid";

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

  if (mode === "widget" || process.env.BUILD_MODE === "widget") {
    return {
      resolve: {
        alias,
      },
      build: {
        lib: {
          entry: "widget/web-component.index.ts",
          formats: ["es"],
          fileName: "full",
        },
        // does not minify whitespaces when using the 'es' format in lib mode,
        // as it removes pure annotations and breaks tree-shaking.
        minify: true,
        cssTarget: ["es2022"],
        outDir: "dist/elements",
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
          plugins: [],
        },
      },
      plugins: [viteSolidPlugin(), tailwindcss(), command === "serve" ? writeToDisk() : undefined],
    };
  }

  return {
    base: process.env.BASE ?? undefined,
    resolve: {
      alias,
    },
    build: {
      cssTarget: ["es2022"],
    },
    plugins: [vike(), vikeSolid(), tailwindcss()],
  };
});
