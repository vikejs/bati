import type { Nodes, Parents } from "mdast";
import { visit } from "unist-util-visit";
import type { FilterHandler, FilterObject, ZoneHandler } from "./types.js";
import { commentMarker, objectFilter } from "./utils.js";

export function zone(
  node: Nodes,
  name: string,
  filter: FilterObject | FilterHandler | undefined,
  handler: ZoneHandler,
): void {
  let level: number | undefined;

  let marker: Nodes | undefined;

  let scope: Parents | undefined;

  visit(node, (node: Nodes, index: number | undefined, parent: Parents | undefined) => {
    const info = commentMarker(node);

    const type = (info?.suffix ?? "").toLowerCase();
    if (!(["start", "end"].includes(type) && info?.name === name)) return;
    const filterOK = typeof filter === "function" ? filter(info) : objectFilter(filter, info);
    //if (type === "start" && !filterOK) return;

    if (parent && index !== undefined && type) {
      if (!scope && type === "start" && filterOK) {
        level = 0;
        marker = node;
        scope = parent;
      }

      if (typeof level === "number" && marker && scope && parent === scope) {
        if (type === "start") {
          level++;
        } else {
          level--;
        }

        if (type === "end" && !level) {
          // @ts-expect-error: Assume `scope` is a valid parent of `node`.
          const start = scope.children.indexOf(marker);

          const nodes = handler(marker, scope.children.slice(start + 1, index), node, {
            start,
            end: index,
            parent: scope,
          });

          if (!nodes) {
            marker = undefined;
            scope = undefined;
            return;
          }

          // Ensure no empty nodes are inserted.
          // This could be the case if `end` is in `nodes` but no `end` node exists.
          /** @type {Array<Nodes>} */
          const result: Nodes[] = [];
          let offset = -1;

          while (++offset < nodes.length) {
            const node = nodes[offset];
            if (node) result.push(node);
          }

          const deleteCount = index - start + 1;
          scope.children.splice(
            start,
            deleteCount,
            // @ts-expect-error: Assume the correct children are passed.
            ...result,
          );

          marker = undefined;
          scope = undefined;

          return index - deleteCount + result.length;
        }
      }
    }
  });
}
