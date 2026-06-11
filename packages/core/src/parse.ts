import { tidyWhitespace } from "./format.js";
import { type FileContext, extToTarget, runCodemods } from "./parse/codemods.js";
import type { VikeMeta } from "./types.js";

export async function transformAndFormat(code: string, meta: VikeMeta, options: { filepath: string }) {
  const { code: transformed, context } = await transform(code, options.filepath, meta);

  // The codemods (`format: true`) reindent their edits; tidy the residual whitespace when they touched
  // the file, and always for `.ts`/`.tsx`. YAML is already line-clean, and a verbatim-copy file (e.g.
  // `.md`, where blank lines are meaningful) is left untouched.
  const isYaml = extToTarget(options.filepath) === "yaml";
  const tidy =
    !isYaml && (transformed !== code || options.filepath.endsWith(".ts") || options.filepath.endsWith(".tsx"));

  return { code: tidy ? tidyWhitespace(transformed) : transformed, context };
}

/** The codemod pipeline without Prettier — the core of {@link transformAndFormat}, exposed for the specs. */
export function transform(
  code: string,
  filename: string,
  meta: VikeMeta,
): Promise<{ code: string; context: FileContext }> {
  return runCodemods(code, meta, filename);
}

export type { FileContext };
