import type { categoriesGroups } from "./groups.js";

export interface Feature<C = string> {
  label: string;
  flag: string;
  category: C;
  image?: string;
  url?: string;
  description?: string;
  dependsOn?: ReadonlyArray<string>;
  spectrum?: "beaten_path" | "bleeding_edge";
  tagline?: string;
  links?: FeatureLink[];
  /**
   * When set, BATI generates one agent skill for this feature: a pointer to `llms` (the live docs),
   * triggered by `description`. Emitted when the feature is in the generated stack — selected, or
   * always-on (`readonly`, like Vike). The body stores no how-to, so it never goes stale; `description`
   * says *when* to read the docs, not *how*, so it doesn't either.
   */
  skill?: { description: string; llms: string };
  repo?: string;
  // if true, it means that the feature is not yet implemented, but could be displayed in the UI
  disabled?: boolean;
  // if true, do not display in the CLI
  invisibleCli?: boolean;
  // if true, do not display in the Web UI
  invisibleWeb?: boolean;
  // if true, do not display in the description on top of the Widget
  invisibleDescription?: boolean;
  // if true, cannot be toggled off (implies selected by default, otherwise use `disabled`)
  readonly?: boolean;
  selected?: boolean;
  tooltip?: string;
}

export interface FeatureLink {
  label: string;
  href: string;
}

export interface Category {
  label: string;
  group: categoriesGroups;
  // like <select multiple/>
  multiple?: boolean;
  required?: boolean;
  description?: string;
}
