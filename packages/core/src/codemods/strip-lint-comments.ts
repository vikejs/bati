import { defineCodemod } from "@codegraft/codemod";
import type { GrammarId } from "@codegraft/core";
import type { BatiContext } from "./context.js";

/**
 * Remove `eslint-disable`/`eslint-enable` and `biome-ignore` directive comments when the user didn't
 * pick that linter — the AST-aware replacement for Bati's regex sweep (only real comments, never a
 * string that happens to contain the text).
 */
export const stripLintComments = defineCodemod<BatiContext>((root, ctx) => {
  root.findComments(/eslint-(?:disable|enable)|biome-ignore/).forEach((comment) => {
    if (!ctx.BATI.has(comment.text.includes("biome-ignore") ? "biome" : "eslint")) comment.remove();
  });
});

export default stripLintComments;

export const targets: GrammarId[] = ["javascript", "typescript", "tsx", "css", "html"];
