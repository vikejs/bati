import { type CategoryLabels, type Flags, features } from "@batijs/features";
import { deepMerge } from "@typescript-eslint/utils/eslint-utils";
import type { Nodes, Root } from "mdast";
import { fromMarkdown, type Value } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import type { StringTransformer } from "../types.js";
import { createTOC } from "./createTOC.js";
import type { ContentChanger, classConfig, MarkdownOptions, ZoneHandler } from "./types.js";
import { wrapWithComment } from "./utils.js";
import { zone } from "./zone.js";

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

export class MarkdownV2 implements StringTransformer {
  private tree: Root;
  private contents: ContentChanger[] = [];
  private config: classConfig = { defaults: { filter: { section: "features" } } };

  constructor(tree: Root, config?: classConfig) {
    this.tree = tree;
    if (this.config) {
      this.config = deepMerge(this.config, config);
    }
  }

  addMarkdownFeature(markdown: string | ZoneHandler, flag: Flags, options?: MarkdownOptions) {
    const category = features.find((f) => f.flag === flag)!.category as CategoryLabels;
    const opts: MarkdownOptions = { ...options, wrapper: { ...options?.wrapper, category, flag } };
    const optionsMarkdown = deepMerge(this.config.defaults, opts);
    this.contents.push({ markdown, options: optionsMarkdown });
  }

  addMarkdown(markdown: string | ZoneHandler, options: MarkdownOptions = {}) {
    this.contents.push({ markdown, options });
  }

  finalize() {
    this.contents.sort((a, b) => {
      const posa = a.options.position ?? "after";
      const posb = b.options.position ?? "after";

      if (posa === posb) return 0;
      if (posa === "replace" || posb === "replace") return 0;

      return posa === "before" ? -1 : 1;
    });

    for (const { markdown, options } of this.contents) {
      const handler: ZoneHandler =
        typeof markdown === "function"
          ? markdown
          : (start, between, end, _info) => {
              const { position = "after" } = options;

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
    return toMarkdown(this.tree, {
      listItemIndent: "one",
      incrementListMarker: false,
    });
  }
}
