import { defineCodemod } from "@codegraft/codemod";
import { extractDirective } from "./directive.js";

export interface ExtractContext extends Record<string, unknown> {
  /** Raw feature-referencing expressions — directive conditions, `BATI.has(...)` sites, `$$.If` keys —
   *  collected verbatim from the file. `resolve` (in @batijs/graft-graph) mines them for flags. */
  refs: Set<string>;
}

const NAMESPACE = /\$\$/;
const HAS_CALL = /(?:^|\.)BATI\.has$/; // callee of `…BATI.has("flag")`
const HAS_GETTER = /(?:^|\.)BATI\.has[A-Z]\w*$/; // member read `…BATI.hasDatabase`
const IF_TYPE_KEY = /\$\$\.BATI/; // `$$.If<>` type-map keys are string literals holding `$$` conditions

/**
 * Locate every feature reference in a boilerplate file without evaluating it — the read-only twin of
 * `batiCodemod`. No namespace gate: `$`-generators reference features through real `meta.BATI.has`
 * with no `$$` marker, and a `$$` scan-gate would skip them. The codemod only finds the sites; the
 * collected strings stay raw for `resolve` to mine.
 */
export const batiExtract = defineCodemod<ExtractContext>((root, { refs }) => {
  root.findComments(NAMESPACE).forEach((comment) => {
    const directive = extractDirective(comment.text);
    if (directive) refs.add(directive);
  });
  root.find("call_expression", { function: HAS_CALL }).forEach((call) => refs.add(call.text));
  root.find("member_expression", { text: HAS_GETTER }).forEach((member) => refs.add(member.text));
  root.find("string", { text: IF_TYPE_KEY }).forEach((key) => refs.add(key.text));
});
