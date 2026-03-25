import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { globby } from "globby";
import type { Plugin } from "rolldown";
import { type InlineConfig, build as tsdownBuild } from "tsdown";

const forbidImportsPlugin: Plugin = {
  name: "forbid-imports",
  resolveId: {
    filter: {
      id: {
        exclude: [/@batijs\/core$/, /^@batijs\/features$/, /^\.\//, /^\.\.\//],
      },
    },
    handler(importPath, importer) {
      if (!importer?.match(/.*\$([^/]+)\.[tj]sx?$/)) return null;
      this.error(
        `Trying to import '${importPath}': only '@batijs/core', '@batijs/features' and relative files can be imported in $[...].ts files`,
      );
    },
  },
};

export async function build() {
  const fileEntries = await globby(["./files/**/$!($()*).ts"]);
  const hookEntries = await globby(["./hooks/**/*.ts"]);
  const dtsEntries = await globby(["./files/**/*.ts", "./files/**/*.tsx", "!./files/**/$*", "!./files/**/*.d.ts"]);

  const buildPromises: Promise<unknown>[] = [];

  buildPromises.push(
    tsdownBuild({
      clean: false,
      entry: await globby(["./bati.config.ts"]),
      outDir: "./dist",
      format: ["esm"],
      dts: false,
      platform: "node",
      treeshake: true,
      onSuccess: async () => console.log("Config build step complete"),
    }),
  );

  const commonTsdownOptions: InlineConfig = {
    clean: false,
    format: ["esm"],
    platform: "node",
    unbundle: true,
    plugins: [forbidImportsPlugin],
    deps: {
      neverBundle: ["@batijs/core"],
    },
    outputOptions: {
      sanitizeFileName: false,
      chunkFileNames: "chunk-[name]-[hash].js",
      assetFileNames: "asset-[name]-[hash][extname]",
      entryFileNames(chunkInfo) {
        if (!chunkInfo.isEntry) return `asset-${chunkInfo.name}.mjs`;
        return `${chunkInfo.name}.mjs`;
      },
    },
    dts: false,
  };

  if (fileEntries.length > 0) {
    buildPromises.push(
      tsdownBuild({
        ...commonTsdownOptions,
        entry: fileEntries,
        outDir: "./dist/files",
        root: "./files",
      }),
    );
  }

  if (hookEntries.length > 0) {
    buildPromises.push(
      tsdownBuild({
        ...commonTsdownOptions,
        entry: hookEntries,
        outDir: "./dist/hooks",
        root: "./hooks",
      }),
    );
  }

  if (dtsEntries.length > 0) {
    buildPromises.push(
      tsdownBuild({
        clean: false,
        entry: dtsEntries,
        outDir: "./dist/types",
        root: "./files",
        format: ["esm"],
        platform: "node",
        outputOptions: {
          sanitizeFileName: false,
        },
        unbundle: true,
        dts: {
          resolver: "oxc",
          emitDtsOnly: true,
        },
        deps: {
          skipNodeModulesBundle: true,
        },
        onSuccess: async () => {
          const distDir = path.join(process.cwd(), "dist", "types");
          const emittedFiles = (await globby(["./dist/types/**/*.d.mts"])).map((f) =>
            path.relative(distDir, path.resolve(f)).replace(/\\/g, "/"),
          );

          const packageJsonTypes = emittedFiles.reduce(
            (acc, cur) => {
              const key = cur.slice(0, -".d.mts".length);
              acc.exports[`./${key}`] = { types: `./dist/types/${cur}` };
              acc.typesVersions["*"][key] = [`./dist/types/${cur}`];
              return acc;
            },
            {
              exports: {} as Record<string, { types: string }>,
              typesVersions: { "*": {} as Record<string, string[]> },
            },
          );

          const packageJson = JSON.parse(await readFile("package.json", "utf-8"));
          packageJson.exports = packageJsonTypes.exports;
          packageJson.typesVersions = packageJsonTypes.typesVersions;

          await writeFile("package.json", JSON.stringify(packageJson, undefined, 2).replace(/\r\n/g, "\n"), "utf-8");

          console.log("Types generated into", distDir);
          console.log("Build step complete");
        },
      }),
    );
  } else {
    async function removeTypes() {
      const packageJson = JSON.parse(await readFile("package.json", "utf-8"));
      delete packageJson.exports;
      delete packageJson.typesVersions;

      await writeFile("package.json", JSON.stringify(packageJson, undefined, 2).replace(/\r\n/g, "\n"), "utf-8");
    }

    buildPromises.push(removeTypes());
  }

  await Promise.all(buildPromises);
}
