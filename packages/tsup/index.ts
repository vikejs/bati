import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "path";
import type { OnResolveArgs } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { globby } from "globby";
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

async function copyFilesToDist() {
  const files = await globby(["./files/**/!($*)", "./files/**/$$*"], {
    cwd: process.cwd(),
  });

  for (const file of files) {
    const dist = path.join("dist", file);
    const distDirname = path.dirname(dist);

    await mkdir(distDirname, { recursive: true });
    await copyFile(file, dist);
  }

  console.log("Files copied to", path.join(process.cwd(), "dist"));
}

async function buildTypes() {
  const program = tsc.createProgramFromConfig({
    basePath: process.cwd(),
    configFilePath: "tsconfig.json",
    compilerOptions: {
      rootDir: "./files",
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
    const distTypes = path.join(process.cwd(), "dist", "types");
    const relFiles = emittedFiles.map((f) => path.relative(distTypes, f));

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
    console.log("Types generated into", distTypes);
  }
}

// Inspired by https://github.com/nodejs/node/issues/8033#issuecomment-388323687
function overrideStderr() {
  const originalStdoutWrite = process.stderr.write.bind(process.stderr);

  let activeIntercept = false;
  let taskOutput: string = "";
  const retained: Function[] = [];

  // @ts-ignore
  process.stderr.write = (chunk, encoding, callback) => {
    if (activeIntercept && typeof chunk === "string") {
      taskOutput += chunk;
    }

    retained.push(() => originalStdoutWrite(chunk, encoding, callback));

    return true;
  };

  activeIntercept = true;

  return {
    flush() {
      const result = taskOutput;

      activeIntercept = false;
      taskOutput = "";

      return result;
    },
    printBack() {
      retained.forEach((f) => f());
    },
  };
}

const { flush, printBack } = overrideStderr();

// Custom DTS build, as tsup doesn't allow passing any option to rollup
process.on("beforeExit", async () => {
  if (path.basename(path.dirname(process.cwd())) === "boilerplates") {
    try {
      if (flush().includes("Cannot find")) {
        await copyFilesToDist();
      } else {
        printBack();
      }
      await buildTypes();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
  process.exit(0);
});
