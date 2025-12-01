import type { Nodes, Root } from "mdast";
import { heading, text } from "mdast-builder";
import { toc } from "mdast-util-toc";

const tocHeading = "Contents";

export function createTOC(tree: Root): Nodes[] | null {
  const tocItems = toc(tree, {
    maxDepth: 4,
    minDepth: 2,
    skip: tocHeading,
    tight: true,
  });
  if (tocItems?.map === undefined) {
    return null;
  }
  return [heading(2, text(tocHeading)), tocItems.map] as Nodes[];
}
