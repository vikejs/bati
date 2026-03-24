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
  await Promise.all([
    tsdownBuild({
      entry: await globby(["./bati.config.ts"]),
      outDir: "./dist",
      format: ["esm"],
      platform: "node",
      treeshake: true,
      onSuccess: async () => console.log("Config build step complete"),
    }),
    tsdownBuild({
      entry: await globby(["./files/**/$!($()*).ts", "./hooks/**/*.ts"]),
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
        const distTypes = path.join(process.cwd(), "dist", "types");
        const emittedFiles = (await globby(["./dist/types/**/*.d.ts"])).map((f) =>
          path.relative(distTypes, path.resolve(f)).replace(/\\/g, "/"),
        );

        const packageJsonTypes = emittedFiles.reduce(
          (acc, cur) => {
            const key = cur.slice(0, -".d.ts".length);
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

        console.log("Types generated into", distTypes);
        console.log("Build step complete");
      },
    }),
  ]);
}
