import { categoriesGroups } from "./groups.js";

export interface Feature<C = string> {
  label: string;
  flag: string;
  category: C;
  image?: string;
  url?: string;
  description?: string;
  // if true, it means that the feature is not yet implemented, but could be displayed in the UI
  disabled?: boolean;
}

export interface Category {
  label: string;
  group: categoriesGroups;
  // like <select multiple/>
  multiple?: boolean;
}
