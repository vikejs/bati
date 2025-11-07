import { formatCode } from "./format.js";
import type { FileContext } from "./parse/linters/common.js";
import { transform } from "./parse/linters/index.js";
import { renderSquirrelly, tags } from "./parse/squirelly.js";
import type { VikeMeta } from "./types.js";

function guessCodeFormatters(code: string, filepath: string) {
  return {
    eslint:
      (code.includes("BATI.has") ||
        code.includes("BATI_TEST") ||
        code.includes("/*# BATI ") ||
        code.includes("@batijs/") ||
        filepath.endsWith(".ts") ||
        filepath.endsWith(".tsx")) &&
      !filepath.endsWith(".css"),
    squirelly: code.includes(tags[0]),
  };
}

// Single-line comment patterns
const eslintSingleLineRegex =
  /\/\/\s*eslint(?:-disable|-enable|-disable-next-line|-disable-line)?[^\n]*/gim;
const biomeSingleLineRegex = /\/\/\s*biome-ignore[^\n]*/gim;

// Multi-line comment patterns (on one line)
const eslintMultiLineRegex =
  /\/\*+\s*eslint(?:-disable|-enable|-disable-next-line|-disable-line)?[^\n*]*\*+\//gim;
const biomeMultiLineRegex = /\/\*+\s*biome-ignore[^\n*]*\*+\//gim;

// Combined patterns
const eslintRegex = new RegExp(
  `${eslintSingleLineRegex.source}|${eslintMultiLineRegex.source}`,
  "gim",
);
const biomeRegex = new RegExp(
  `${biomeSingleLineRegex.source}|${biomeMultiLineRegex.source}`,
  "gim",
);

export async function transformAndFormat(
  code: string,
  meta: VikeMeta,
  options: { filepath: string },
) {
  const { eslint, squirelly } = guessCodeFormatters(code, options.filepath);
  let c = code;
  let context: FileContext | undefined;
  let format = false;
  if (squirelly) {
    c = renderSquirrelly(c, meta);
    format = true;
  }
  if (eslint) {
    const res = transform(c, options.filepath, meta);
    c = res.code;
    context = res.context;
    format = true;
  }

  // Remove eslint comments
  if (!meta.BATI.has("eslint") && eslintRegex.test(c)) {
    c = c.replace(eslintRegex, "");
    format = true;
  }

  // Remove biome comments
  if (!meta.BATI.has("biome") && biomeRegex.test(c)) {
    c = c.replace(biomeRegex, "");
    format = true;
  }

  return {
    code: format ? await formatCode(c, options) : c,
    context,
  };
}

export type { FileContext };
