import { defineConfig as _defineConfig, type Options } from "tsup";
import { copy } from "esbuild-plugin-copy";
import type { OnResolveArgs } from "esbuild";

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

function isAllowedImport(args: OnResolveArgs) {
  if (args.path === "@batijs/core" || !args.importer.match(/.*\$([^/]+)\.[tj]sx?$/)) {
    return true;
  }
  return Boolean(args.path.match(/^\.?\.\//));
}

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
        {
          name: "forbid-imports",
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              if (!isAllowedImport(args)) {
                return {
                  errors: [
                    {
                      text: `Trying to import '${args.path}': only '@batijs/core' and relative files can be imported in $[...].ts files`,
                    },
                  ],
                };
              }
              return {};
            });
          },
        },
        copy({
          assets: {
            from: ["./files/**/!($*)", "./files/**/$$*"],
            to: ["."],
          },
        }),
      ],
    },
  ]);
}
