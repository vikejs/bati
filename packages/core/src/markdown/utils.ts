import parseAttributes from "attributes-parser";
import type { Nodes } from "mdast";
import type { FilterObject, MarkdownCommentSuffix, WrapperObject } from "./types.js";

const markerExpression = /(\s*<!--(?<attributes>.*)-->\s*)/;

/**
 * Parse a comment marker.
 *
 */
export function commentMarker(value: Nodes) {
  if (!(isNode(value) && value.type === "html")) return;
  const match = value.value.match(markerExpression);
  if (match && match[0].length === value.value.length) {
    const attributes = match.groups?.attributes ?? "";
    const parameters = parseAttributes(attributes);
    const name_matcher = attributes.match(/\s*(?<name>[a-zA-Z0-9_]+)(:(?<suffix>[a-zA-Z0-9_]+)|)/);
    const name = name_matcher?.groups?.name ?? "";
    const suffix = name_matcher?.groups?.suffix ?? "";
    if (attributes.length > 0) {
      return {
        name,
        suffix,
        attributes,
        parameters,
        node: value,
      };
    }
  }
}

export function objectFilter(filter: FilterObject | undefined = {}, info: ReturnType<typeof commentMarker>) {
  for (const key in filter) {
    if (filter[key] !== info?.parameters?.[key]) return false;
  }
  return true;
}

export function createMarkdownComment(suffix: MarkdownCommentSuffix, options: Record<string, unknown>) {
  const { name, ...attributes } = options;
  return {
    type: "html",
    value: `<!--${name ?? "bati"}:${suffix} ${Object.entries(attributes)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ")}-->`,
  };
}

export function wrapWithComment(nodes: Nodes | Nodes[], options: WrapperObject | undefined) {
  const between = Array.isArray(nodes) ? nodes : [nodes];
  if (!options) return between;
  return [createMarkdownComment("start", options), ...between, createMarkdownComment("end", options)];
}

/**
 * Check if something looks like a node.
 *
 */
function isNode(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && "type" in value);
}
