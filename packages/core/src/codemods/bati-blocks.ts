import { defineCodemod } from "@codegraft/codemod";
import type { Collection, GrammarId, RichNode } from "@codegraft/core";
import type { BatiContext } from "./context.js";

/**
 * Comment-delimited conditional blocks — Bati's SquirrellyJS `@if … /if` replacement for files that
 * can't use a JS `if` (CSS, and any grammar with comments). The markers `$$.if(cond)`,
 * `$$.elif(cond)`, `$$.else`, `$$.endif` live in comments; the live branch is kept and every other
 * branch plus all markers are removed. Grammar-agnostic (keys off `findComments`), so the delimiter
 * is whatever the grammar uses. Same-container nesting is supported.
 */
export const batiBlocks = defineCodemod<BatiContext>({ namespace: "$$", format: true }, (root, ctx) => {
  // Markers sharing a parent form one sibling sequence; process each independently.
  const groups = new Map<RichNode | null, Marker[]>();
  for (const marker of root.findComments(MARKER).map(toMarker)) {
    groups.set(marker.parent, [...(groups.get(marker.parent) ?? []), marker]);
  }
  for (const group of groups.values()) processSiblings(group);

  /** Resolve each top-level `if … endif` block in a marker sequence. Nested ifs are skipped here
   *  (`parseBlock`'s depth counter) and only revisited inside a live branch. */
  function processSiblings(group: Marker[]): void {
    for (let i = 0; i < group.length; ) {
      if (group[i].kind !== "if") {
        i++; // a stray elif/else/endif with no opening if
        continue;
      }
      const { block, next } = parseBlock(group, i);
      if (block) processBlock(group, block);
      i = next;
    }
  }

  /** Collect the branch markers (`if`, `elif`*, `else`?) at this depth and their matching `endif`,
   *  or a null block when the `if` is unterminated. */
  function parseBlock(group: Marker[], start: number): { block: Block | null; next: number } {
    const branches = [group[start]];
    let depth = 0;
    for (let i = start + 1; i < group.length; i++) {
      const kind = group[i].kind;
      if (kind === "if") depth++;
      else if (kind === "endif") {
        if (depth === 0) return { block: { branches, endif: group[i] }, next: i + 1 };
        depth--;
      } else if (depth === 0) branches.push(group[i]);
    }
    return { block: null, next: group.length };
  }

  function processBlock(group: Marker[], { branches, endif }: Block): void {
    // First true `if`/`elif` wins; `else` is the fallback; -1 means nothing is live.
    let live = -1;
    let elseBranch = -1;
    for (let k = 0; k < branches.length; k++) {
      const branch = branches[k];
      if (branch.kind === "else") elseBranch = k;
      else if (live === -1 && branch.condition !== null && root.evaluateExpression(branch.condition, ctx)) live = k;
    }
    if (live === -1) live = elseBranch;

    const parent = branches[0].comment.parent();
    branches.forEach((branch, k) => {
      const start = branch.end;
      const end = k + 1 < branches.length ? branches[k + 1].start : endif.start;
      if (k === live) {
        processSiblings(group.filter((m) => m.start >= start && m.start < end)); // nested blocks in the kept branch
      } else {
        removeBetween(parent, start, end);
      }
      branch.comment.remove();
    });
    endif.comment.remove();
  }

  /** Remove a dead branch's direct content within `[start, end)`: top-level named nodes and
   *  direct-child comments — the latter sweeping up any nested-block markers (never processed). */
  function removeBetween(parent: Collection, start: number, end: number): void {
    const within = (c: Collection) => c.node.documentStartIndex >= start && c.node.documentStartIndex < end;
    parent.children().filter(within).remove();
    parent
      .findComments()
      .filter((c) => c.node.parent === parent.node && within(c))
      .remove();
  }
});

export default batiBlocks;

export const targets: GrammarId[] = ["css", "html", "javascript", "typescript", "tsx"];

const MARKER = /\$\$\.(if|elif|else|endif)\b/;

interface Marker {
  kind: "if" | "elif" | "else" | "endif";
  condition: string | null; // present for `if`/`elif`
  comment: Collection;
  start: number;
  end: number;
  parent: RichNode | null;
}

interface Block {
  branches: Marker[];
  endif: Marker;
}

function toMarker(comment: Collection): Marker {
  const kind = comment.text.match(MARKER)![1] as Marker["kind"];
  const condition =
    kind === "if" || kind === "elif"
      ? (comment.text.match(/\$\$\.(?:if|elif)\(([\s\S]*)\)/)?.[1]?.trim() ?? null)
      : null;
  return {
    kind,
    condition,
    comment,
    start: comment.node.documentStartIndex,
    end: comment.node.documentEndIndex,
    parent: comment.node.parent,
  };
}
