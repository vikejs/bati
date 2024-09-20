import { categoriesGroups } from "./groups.js";

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
  repo?: string;
  // if true, it means that the feature is not yet implemented, but could be displayed in the UI
  disabled?: boolean;
  // if true, do not display in the CLI
  invisibleCli?: boolean;
  // if true, cannot be toggled off (implies selected by default, otherwise use `disabled`)
  readonly?: boolean;
  selected?: boolean;
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
