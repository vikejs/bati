import { readFile, writeFile } from "node:fs/promises";
import * as path from "path";
import type { OnResolveArgs } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import tsc from "tsc-prog";
import { defineConfig as _defineConfig, type Options } from "tsup";

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
  if (
    args.path === "@batijs/core" ||
    args.path === "@batijs/features" ||
    !args.importer.match(/.*\$([^/]+)\.[tj]sx?$/)
  ) {
    return true;
  }
  return Boolean(args.path.match(/^\.?\.\//));
}

export function defineBoilerplateConfig() {
  return defineConfig([
    {
      entry: ["./files/**/\\$!($*).ts", "./hooks/**/*.ts"],
      ignoreWatch: ["./dist"],
      dts: false,
      clean: true,
      outDir: "./dist",
      external: ["magicast", "acorn-stage3", "hermes-parser", "tenko", "@batijs/core"],
      esbuildOptions(options) {
        options.outbase = ".";
      },
      esbuildPlugins: [
        {
          name: "forbid-imports",
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              if (!isAllowedImport(args)) {
                return {
                  errors: [
                    {
                      text: `Trying to import '${args.path}': only '@batijs/core', '@batijs/features' and relative files can be imported in $[...].ts files`,
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
            to: ["./files"],
          },
        }),
      ],
    },
  ]);
}

// Custom DTS build, as tsup doesn't allow passing any option to rollup
process.on("beforeExit", async (code) => {
  if (code === 0 && path.basename(path.dirname(process.cwd())) === "boilerplates") {
    const program = tsc.createProgramFromConfig({
      basePath: process.cwd(),
      configFilePath: "tsconfig.json",
      compilerOptions: {
        noEmit: false,
        outDir: "./dist/types",
        declaration: true,
        emitDeclarationOnly: true,
        sourceMap: false,
        listEmittedFiles: true,
      },
      include: ["files/**/*"],
      exclude: ["files/**/$*"],
    });

    const { diagnostics, emitSkipped, emittedFiles } = program.emit();

    if (diagnostics.length) {
      diagnostics.forEach((d) => console.error(`${d.file}:${d.start} ${d.messageText}`));
      return process.exit(1);
    }

    if (emitSkipped) process.exit(1);

    if (emittedFiles && emittedFiles.length) {
      const relFiles = emittedFiles.map((f) => path.relative(path.join(process.cwd(), "dist", "types"), f));

      const packageJsonTypes = relFiles.reduce(
        (acc, cur) => {
          acc.exports[`./${cur.slice(0, -".d.ts".length)}`] = {
            types: `./dist/types/${cur}`,
          };
          acc.typesVersions["*"][`${cur.slice(0, -".d.ts".length)}`] = [`./dist/types/${cur}`];
          return acc;
        },
        {
          exports: {} as Record<string, { types: string }>,
          typesVersions: { "*": {} } as Record<"*", Record<string, string[]>>,
        },
      );

      const packageJson = JSON.parse(await readFile("package.json", "utf-8"));

      packageJson.exports = packageJsonTypes.exports;
      packageJson.typesVersions = packageJsonTypes.typesVersions;

      await writeFile("package.json", JSON.stringify(packageJson, undefined, 2), "utf-8");
    }
  }
  process.exit(0);
});
