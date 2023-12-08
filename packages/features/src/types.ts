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
  // if true, it means that the feature is not yet implemented, but could be displayed in the UI
  disabled?: boolean;
}

export interface Category {
  label: string;
  group: categoriesGroups;
  // like <select multiple/>
  multiple?: boolean;
}
