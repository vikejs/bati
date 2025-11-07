import type { Nodes, Root, List, ListItem } from "mdast";
import { heading, text, list, listItem, paragraph, link } from "mdast-builder";
import { toc } from "mdast-util-toc";

const tocHeading = "Contents";

function flattenTOCList(tocList: List): List {
  const flatItems: ListItem[] = [];

  function extractItems(items: ListItem[]) {
    for (const item of items) {
      // Add the current item (but remove any nested lists)
      const flatItem = { ...item };
      if (flatItem.children) {
        flatItem.children = flatItem.children.filter(child => child.type !== 'list');
      }
      flatItems.push(flatItem);

      // Extract items from any nested lists
      for (const child of item.children) {
        if (child.type === 'list') {
          extractItems(child.children);
        }
      }
    }
  }

  extractItems(tocList.children);
  return { ...tocList, children: flatItems };
}

export function createTOC(tree: Root): Nodes[] | null {
  const tocItems = toc(tree, { maxDepth: 4, minDepth: 2, skip: tocHeading });
  if (tocItems?.map === undefined) {
    return null;
  }

  const flattenedMap = flattenTOCList(tocItems.map);
  return [heading(2, text(tocHeading)), flattenedMap] as Nodes[];
}
