import { readFile } from "node:fs/promises";
import type { Plugin } from "esbuild";

const esbuildPlugin: Plugin = {
  name: "fix-esquery-export",
  setup(build) {
    build.onLoad({ filter: /esquery/ }, async (args) => {
      const text = await readFile(args.path, "utf8");
      const lines = text.split("\n");
      const indexSourceMapComment = lines.findIndex((l) => l.startsWith("//#"));
      lines.splice(
        indexSourceMapComment,
        0,
        ["parse", "match", "matches", "traverse"].map((x) => `export const ${x} = A.${x};`).join("")
      );

      return {
        contents: lines.join("\n"),
        loader: "js",
      };
    });
  },
};

export default esbuildPlugin;
