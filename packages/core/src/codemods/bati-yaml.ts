import { defineCodemod } from "@codegraft/codemod";
import type { Collection, GrammarId } from "@codegraft/core";
import type { BatiContext } from "./context.js";
import { extractDirective } from "./directive.js";

/**
 * YAML conditional-line transform over the `tree-sitter-yaml` grammar. A `# $$.…` comment gates the
 * YAML node (mapping pair / sequence item) on the next line: false drops the node and its leading
 * comment block, true strips only the directive line (keeping any non-directive comments above it).
 *
 * It works positionally, not via `leadingComments`: tree-sitter attaches a comment by structure,
 * which for YAML's indentation can nest a column-0 directive inside the previous deeper mapping — so
 * the target is the next item in document order, and the block to drop is the contiguous comment run
 * directly above it. `remove()` leaves each line's indentation behind; `runCodemods` strips those
 * whitespace-only residue lines before Prettier reformats.
 */
export const batiYaml = defineCodemod<BatiContext>({ namespace: "$$" }, (root, ctx) => {
  const byStart = (a: Collection, b: Collection) => a.node.documentStartIndex - b.node.documentStartIndex;
  const items = [
    ...root.find("block_mapping_pair").map((c) => c),
    ...root.find("block_sequence_item").map((c) => c),
  ].sort(byStart);
  const comments = root
    .findComments()
    .map((c) => c)
    .sort(byStart);

  for (const comment of comments) {
    const condition = extractDirective(comment.text);
    if (condition === null) continue; // a plain comment, not a directive
    const target = items.find((item) => item.node.documentStartIndex > comment.node.documentStartIndex);
    if (target === undefined) continue; // a directive with nothing below to gate

    if (root.evaluateExpression(condition, ctx)) {
      comment.remove({ separator: true }); // keep the node, strip only the directive line
    } else {
      // Drop the node and the comment run above it; `separator` takes each line's trailing newline so
      // the section leaves no residual blank behind.
      commentBlockAbove(target, comments).forEach((c) => {
        c.remove({ separator: true });
      });
      target.remove({ separator: true });
    }
  }
});

export const targets: GrammarId[] = ["yaml"];

/** The contiguous run of comment lines directly above `target` (regular comments and the directive
 *  alike) — what Bati drops together with the node. */
function commentBlockAbove(target: Collection, comments: Collection[]): Collection[] {
  const block: Collection[] = [];
  let expectedRow = target.node.startPosition.row - 1;
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    if (comment.node.documentStartIndex >= target.node.documentStartIndex) continue; // below the target
    if (comment.node.endPosition.row !== expectedRow) break; // a blank line (or content) breaks the run
    block.unshift(comment);
    expectedRow = comment.node.startPosition.row - 1;
  }
  return block;
}
