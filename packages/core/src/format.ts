/**
 * Finalize transformed output. The codemods' `format: true` reindents their own edits; this cleans up
 * what reindentation leaves behind — strip trailing whitespace, collapse runs of blank lines to one,
 * end with a single newline. It deliberately does **not** reflow to a print width, so source line
 * layout is preserved. Empty input stays empty (the build then drops the file).
 */
export function tidyWhitespace(code: string): string {
  const tidied = code
    .replace(/[^\S\n]+$/gm, "") // trailing spaces/tabs per line
    .replace(/\n{3,}/g, "\n\n") // at most one blank line in a row
    .trim(); // leading/trailing blank lines
  return tidied === "" ? "" : `${tidied}\n`;
}
