/** The `$$…` expression a directive comment carries, regardless of delimiter (`// $$.x`, `//# $$.x`,
 *  `# $$.x`, a one-line block comment `/* $$.x *\/`, or an html `<!-- $$.x -->` whose trailing
 *  terminator is trimmed); `null` when the comment is not a `$$` directive. */
export function extractDirective(commentText: string): string | null {
  // Capture an optional leading `!` so a negated gate (`//# !$$.BATI.has("x")`) keeps its negation;
  // anchoring on `$$` alone would silently drop it. The `<!--` opener never trips this (its `!` is
  // followed by `-`, not `$$`).
  const match = commentText.match(/!?\s*\$\$[^\n]*/);
  return match ? match[0].replace(/\s*(?:#*\s*\*\/|-->)\s*$/, "").trim() : null;
}
