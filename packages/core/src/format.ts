import type { Plugin } from "prettier";
import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";
import * as prettierPluginHtml from "prettier/plugins/html";
import * as prettierPluginCss from "prettier/plugins/postcss";
import * as prettierPluginYaml from "prettier/plugins/yaml";
import { format } from "prettier/standalone";

// Route the TypeScript language to Babel's `babel-ts` parser instead of importing
// `prettier/plugins/typescript`, which bundles a second copy of the TS compiler (~876 KB).
// `babel-ts` ships inside the already-bundled babel plugin. Registering the *language*
// (not just passing `parser`) makes both filepath inference (.ts/.tsx) and Vue embed
// inference (`<script lang="ts">`) resolve to babel-ts.
const typescriptViaBabel: Plugin = {
  languages: [
    {
      name: "TypeScript",
      parsers: ["babel-ts"],
      extensions: [".ts", ".mts", ".cts", ".tsx"],
      aliases: ["ts", "tsx", "typescript"],
      vscodeLanguageIds: ["typescript", "typescriptreact"],
    },
  ],
};

/** Format transformed output with Prettier, inferring the parser from `filepath`. The codemods leave
 *  their edits structurally correct but not reflowed; this is the finishing pass. */
export function formatCode(code: string, options: { filepath: string }): Promise<string> {
  return format(code, {
    plugins: [
      prettierPluginBabel,
      // biome-ignore lint/suspicious/noExplicitAny: type mismatch
      prettierPluginEstree as any,
      prettierPluginHtml,
      prettierPluginCss,
      prettierPluginYaml,
      typescriptViaBabel,
    ],
    filepath: options.filepath,
    printWidth: 120,
  });
}
