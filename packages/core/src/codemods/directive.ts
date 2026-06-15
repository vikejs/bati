/** The `$$…` expression a directive comment carries, regardless of delimiter (`// $$.x`, a YAML
 *  `# $$.x`, a one-line block comment `/* $$.x *\/`, or an html `<!-- $$.x -->`); `null` when the
 *  comment is not a `$$` directive. */
export function extractDirective(commentText: string): string | null {
  // Take the whole comment body, only its delimiter and terminator stripped. Anchoring on `$$` would
  // drop a leading `(` or `!` and corrupt the condition — `($$.a || $$.b) && !$$.c` would collapse to
  // `$$.a || $$.b`. It is a directive iff the body references `$$`.
  const expression = commentText
    .replace(/^\s*(?:\/\/|#|\/\*|<!--)\s*/, "")
    .replace(/\s*(?:\*\/|-->)\s*$/, "")
    .trim();
  return expression.includes("$$") ? expression : null;
}
