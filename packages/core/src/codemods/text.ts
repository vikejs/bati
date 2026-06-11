/** Strip one layer of surrounding quotes from a string-literal's text (`'a'` / `"a"` / `` `a` `` → `a`). */
export function unquote(text: string): string {
  return text.replace(/^['"`]|['"`]$/g, "");
}
