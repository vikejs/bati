import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { globby } from "globby";
import type { Plugin } from "rolldown";
import { build as tsdownBuild } from "tsdown";

const forbidImportsPlugin: Plugin = {
  name: "forbid-imports",
  resolveId: {
    filter: {
      id: /^(?!@batijs\/core$|@batijs\/features$|\.\.?\/)/,
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
  const fileEntries = await globby(["./files/**/$!($()*).ts", "./hooks/**/*.ts"]);

  await Promise.all([
    tsdownBuild({
      entry: await globby(["./bati.config.ts"]),
      outDir: "./dist",
      format: ["esm"],
      platform: "node",
      treeshake: true,
      onSuccess: async () => console.log("Config build step complete"),
    }),
    fileEntries.length > 0
      ? tsdownBuild({
          entry: fileEntries,
          outDir: "./dist",
          format: ["esm"],
          platform: "node",
          plugins: [forbidImportsPlugin],
          deps: {
            neverBundle: ["@batijs/core"],
          },
          dts: {
            oxc: true,
            compilerOptions: {
              baseUrl: "./",
              rootDir: "./files",
              outDir: "./dist/types",
              declaration: true,
              emitDeclarationOnly: false,
              sourceMap: false,
            },
          },
          onSuccess: async () => {
            const distDir = path.join(process.cwd(), "dist");
            const emittedFiles = (await globby(["./dist/**/*.d.mts", "!./dist/types/**"])).map((f) =>
              path.relative(distDir, path.resolve(f)).replace(/\\/g, "/"),
            );

            const packageJsonTypes = emittedFiles.reduce(
              (acc, cur) => {
                const key = cur.slice(0, -".d.mts".length);
                acc.exports[`./${key}`] = { types: `./dist/${cur}` };
                acc.typesVersions["*"][key] = [`./dist/${cur}`];
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
        })
      : Promise.resolve(),
  ]);
}
