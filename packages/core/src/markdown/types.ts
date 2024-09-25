import type { Flags, CategoryLabels } from "@batijs/features";
import type { Nodes, Parents } from "mdast";
import type { commentMarker } from "./utils.js";

export type MarkdownPosition = "before" | "after" | "replace";
export type Sections = "document" | "intro" | "features" | "TOC";

export type FilterHandler = (info: ReturnType<typeof commentMarker>) => boolean;
export type FilterObject = {
  section?: Sections;
  category?: CategoryLabels;
  flag?: Flags;
  [key: string]: undefined | string | number | boolean;
};

export type WrapperObject = FilterObject & { name?: string };

export type MarkdownOptions = {
  filter?: FilterObject | FilterHandler;
  position?: MarkdownPosition;
  wrapper?: WrapperObject;
};

export type ContentChanger = {
  markdown: string | ZoneHandler;
  options: MarkdownOptions;
};

export type classConfig = {
  defaults?: MarkdownOptions;
};

export type MarkdownCommentSuffix = "start" | "end";

export type Info = {
  parent: Parents;
  start: number;
  end: number;
};

// zone.ts
export type ZoneHandler = (start: Nodes, between: Nodes[], end: Nodes, info: Info) => Nodes[] | null | undefined | void;
