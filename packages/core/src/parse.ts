import { formatCode } from "./format.js";
import { type FileContext, runCodemods } from "./parse/codemods.js";
import type { VikeMeta } from "./types.js";

export async function transformAndFormat(code: string, meta: VikeMeta, options: { filepath: string }) {
  const { code: transformed, context } = await runCodemods(code, meta, options.filepath);

  // Prettier-format the result when the codemods touched the file, and always for `.ts`/`.tsx`. The
  // codemods leave their edits' indentation for the formatter to tidy (incl. YAML, which Prettier
  // reparses); a verbatim-copy file (e.g. `.md`, where blank lines are meaningful) is left untouched.
  const format = transformed !== code || options.filepath.endsWith(".ts") || options.filepath.endsWith(".tsx");

  return { code: format ? await formatCode(transformed, options) : transformed, context };
}

export type { FileContext };
