import { formatCode } from "./format.js";
import { transform } from "./parse/linters/index.js";
import { renderSquirrelly, tags } from "./parse/squirelly.js";
import type { VikeMeta } from "./types.js";

function guessCodeFormatters(code: string) {
  return {
    eslint: code.includes("BATI.has") || code.includes("bati:") || code.includes("@batijs/"),
    squirelly: code.includes(tags[0]),
  };
}

export function transformAndFormat(code: string, meta: VikeMeta, options: { filepath: string }) {
  const { eslint, squirelly } = guessCodeFormatters(code);
  let c = code;
  let format = false;
  if (squirelly) {
    c = renderSquirrelly(c, meta);
    format = true;
  }
  if (eslint) {
    c = transform(c, options.filepath, meta);
    format = true;
  }
  return format ? formatCode(c, options) : c;
}
