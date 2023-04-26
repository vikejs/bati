import { defineConfig as _defineConfig, type Options } from "tsup";
import { copy } from "esbuild-plugin-copy";

function overrideOptions(o: Options): Options {
  return {
    format: "esm",
    esbuildOptions(options) {
      options.assetNames = "asset-[name]-[hash]";
      options.chunkNames = "chunk-[name]-[hash]";
      return options;
    },
    ...o,
  };
}

export const defineConfig: typeof _defineConfig = (args) => {
  if (Array.isArray(args)) {
    return _defineConfig(args.map((o) => overrideOptions(o)));
  } else if (typeof args === "function") {
    return _defineConfig((o) => args(overrideOptions(o)));
  }
  return _defineConfig(overrideOptions(args));
};

export function defineBoilerplateConfig() {
  return defineConfig([
    {
      entry: ["./files/**/\\$!($*).ts"],
      ignoreWatch: ["./dist"],
      dts: false,
      clean: true,
      outDir: "./dist/files",
      external: ["magicast"],
      esbuildPlugins: [
        copy({
          assets: {
            from: ["./files/**/!($*)", "./files/**/$$*"],
            to: ["."],
          },
        }),
      ],
    },
    {
      entry: ["./index.ts"],
      format: "esm",
      dts: true,
      clean: true,
      outDir: "./dist",
    },
  ]);
}
