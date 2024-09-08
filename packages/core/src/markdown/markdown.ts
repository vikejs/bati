import { fromMarkdown, type Value } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { zone, type FilterHandler, type FilterObject, type ZoneHandler } from "./zone.js";
import type { Root, Nodes } from "mdast";
import { commentMarker, wrapWithComment } from "./utils.js";
import { categoryLabelOrder, type CategoryLabels } from "@batijs/features";
import { deepMerge } from "@typescript-eslint/utils/eslint-utils";

export function parseMarkdown(text: string) {
  const markdownText = /<!--\s*bati:start\s+section="document"\s*-->/.test(text)
    ? text
    : `<!--bati:start section="document"-->\n${text}\n<!--bati:end section="document"-->`;
  return new MarkdownV2(fromMarkdown(markdownText as Value));
}

export type MarkdownPosition = "before" | "after" | "replace";

export type WrapperObject = FilterObject & {
  name?: string;
};

type MarkdownOptions = {
  filter?: FilterObject | FilterHandler;
  position?: MarkdownPosition;
  wrapper?: WrapperObject;
};

type ContentChanger = {
  markdown: string | ZoneHandler;
  options: MarkdownOptions;
};

export class MarkdownV2 {
  private tree: Root;
  private contents: ContentChanger[] = [];

  constructor(tree: Root) {
    this.tree = tree;
  }

  addMarkdown(markdown: string | ZoneHandler, options: MarkdownOptions = {}) {
    const optionsMarkdown = deepMerge({ filter: { section: "features" } }, options);

    this.contents.push({ markdown, options: optionsMarkdown });
  }

  finalize() {
    for (const { markdown, options } of this.contents) {
      const handler: ZoneHandler =
        typeof markdown === "function"
          ? markdown
          : (start, between, end, _info) => {
              const { position = "after" } = options;

              // add a new feature sorted by categories in feature list
              if (
                ["before", "after"].includes(position) &&
                between.length > 0 &&
                options?.wrapper?.flag &&
                Object.keys(options?.filter ?? {}).length === 1 &&
                (options?.filter as FilterObject)?.section === "features"
              ) {
                const existingCategories = between.reduce(
                  (pv: Record<CategoryLabels, number>, node, ci) => {
                    const info = commentMarker(node);
                    if (!info || info.name !== "bati" || info.suffix !== "start" || !info.parameters?.["category"])
                      return pv;
                    pv[info.parameters.category as CategoryLabels] = ci;
                    return pv;
                  },
                  {} as Record<CategoryLabels, number>,
                );

                // find existing category which based on categoryLabelOrder after the current category
                const category = options.wrapper.category as CategoryLabels;

                let nextCategoryIndex = -1;
                for (let index = categoryLabelOrder.indexOf(category) + 1; index < categoryLabelOrder.length; index++) {
                  if (existingCategories?.[categoryLabelOrder[index]] !== undefined) {
                    nextCategoryIndex = existingCategories[categoryLabelOrder[index]];
                    break;
                  }
                }

                if (nextCategoryIndex !== -1) {
                  // The entry in existingCategories which is after the value in category
                  const betweenBeforeCategory = between.slice(0, nextCategoryIndex);
                  const betweenAfterCategory = between.slice(nextCategoryIndex);
                  return [
                    start,
                    ...betweenBeforeCategory,
                    ...wrapWithComment(fromMarkdown(markdown), options?.wrapper),
                    ...betweenAfterCategory,
                    end,
                  ] as Nodes[];
                } else {
                  return [
                    start,
                    ...between,
                    ...wrapWithComment(fromMarkdown(markdown), options?.wrapper),
                    end,
                  ] as Nodes[];
                }
              }
              switch (position) {
                case "replace":
                  return [start, ...wrapWithComment([fromMarkdown(markdown)], options?.wrapper), end] as Nodes[];
                case "before":
                  return [
                    start,
                    ...wrapWithComment(fromMarkdown(markdown as Value), options?.wrapper),
                    ...between,
                    end,
                  ] as Nodes[];
                case "after":
                  return [
                    start,
                    ...between,
                    ...wrapWithComment(fromMarkdown(markdown), options?.wrapper),
                    end,
                  ] as Nodes[];
                default:
                  break;
              }
            };

      zone(this.tree, "bati", options?.filter, handler);
    }
    return toMarkdown(this.tree);
  }
}
