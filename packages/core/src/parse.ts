import { formatCode } from "./format.js";
import type { FileContext } from "./parse/linters/common.js";
import { transform } from "./parse/linters/index.js";
import { renderSquirrelly, tags } from "./parse/squirelly.js";
import type { VikeMeta } from "./types.js";

function guessCodeFormatters(code: string) {
  return {
    eslint: code.includes("BATI.has") || code.includes("/*# BATI ") || code.includes("@batijs/"),
    squirelly: code.includes(tags[0]),
  };
}

export async function transformAndFormat(code: string, meta: VikeMeta, options: { filepath: string }) {
  const { eslint, squirelly } = guessCodeFormatters(code);
  let c = code;
  let context: FileContext | undefined = undefined;
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
  return {
    code: format ? await formatCode(c, options) : c,
    context,
  };
}
