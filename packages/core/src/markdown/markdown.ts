import { fromMarkdown, type Value } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { zone } from "./zone.js";
import type { Root, Nodes } from "mdast";
import { commentMarker, wrapWithComment } from "./utils.js";
import { categoryLabelOrder, features, type CategoryLabels, type Flags } from "@batijs/features";
import { deepMerge } from "@typescript-eslint/utils/eslint-utils";
import type { classConfig, ContentChanger, MarkdownOptions, FilterObject, ZoneHandler } from "./types.js";
import { createTOC } from "./createTOC.js";

export function parseMarkdown(text: string, defaults?: MarkdownOptions) {
  const markdownText = /<!--\s*bati:start\s+section="document"\s*-->/.test(text)
    ? text
    : `<!--bati:start section="document"-->\n${text}\n<!--bati:end section="document"-->`;
  return new MarkdownV2(
    fromMarkdown(markdownText as Value),
    defaults
      ? {
          defaults,
        }
      : undefined,
  );
}

function getNodesFromRoot(tree: Root): Nodes[] {
  return tree.children;
}

export class MarkdownV2 {
  private tree: Root;
  private contents: ContentChanger[] = [];
  private config: classConfig = { defaults: { filter: { section: "features" } } };

  constructor(tree: Root, config?: classConfig) {
    this.tree = tree;
    if (this.config) {
      this.config = deepMerge(this.config, config);
    }
  }

  addMarkdownFeature(markdown: string | ZoneHandler, flag: Flags) {
    const category = features.find((f) => f.flag === flag)!.category as CategoryLabels;
    const options = { wrapper: { category, flag } };
    const optionsMarkdown = deepMerge(this.config.defaults, options);
    this.contents.push({ markdown, options: optionsMarkdown });
  }

  addMarkdown(markdown: string | ZoneHandler, options: MarkdownOptions = {}) {
    this.contents.push({ markdown, options });
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
                    ...wrapWithComment(getNodesFromRoot(fromMarkdown(markdown)), options?.wrapper),
                    ...betweenAfterCategory,
                    end,
                  ] as Nodes[];
                } else {
                  return [
                    start,
                    ...between,
                    ...wrapWithComment(getNodesFromRoot(fromMarkdown(markdown)), options?.wrapper),
                    end,
                  ] as Nodes[];
                }
              }
              switch (position) {
                case "replace":
                  return [
                    start,
                    ...wrapWithComment(getNodesFromRoot(fromMarkdown(markdown)), options?.wrapper),
                    end,
                  ] as Nodes[];
                case "before":
                  return [
                    start,
                    ...wrapWithComment(getNodesFromRoot(fromMarkdown(markdown as Value)), options?.wrapper),
                    ...between,
                    end,
                  ] as Nodes[];
                case "after":
                  return [
                    start,
                    ...between,
                    ...wrapWithComment(getNodesFromRoot(fromMarkdown(markdown)), options?.wrapper),
                    end,
                  ] as Nodes[];
                default:
                  break;
              }
            };

      zone(this.tree, "bati", options?.filter, handler);
    }
    zone(this.tree, "bati", { section: "TOC" }, (start, _between, end) => {
      const toc = createTOC(this.tree);
      if (!toc) return;
      return [start, ...toc, end];
    });
    return toMarkdown(this.tree);
  }
}
