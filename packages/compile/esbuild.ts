import type { OnResolveArgs } from "esbuild";
import * as esbuild from "esbuild";
import { globby } from "globby";

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

export async function build() {
  await esbuild.build({
    entryPoints: await globby(["./files/**/\\$!($*).ts", "./hooks/**/*.ts", "./bati.config.ts"]),
    outdir: "./dist",
    outbase: ".",
    format: "esm",
    bundle: true,
    platform: "node",
    external: ["@batijs/core"],
    plugins: [
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
    ],
  });
  console.log("Build step complete");
}
