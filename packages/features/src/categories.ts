import { categoriesGroups } from "./groups.js";
import type { Category } from "./types.js";

// TODO: Implement new grouping. See https://whimsical.com/bati-wizard-SNJAhTbuJHFF5hDSXgkp2i
//  1. Move groups definition to website directly.
//     That way it's easier to write conditional dependencies and display logic (can leverage solid)
//  2. Find a way to group Utilities in a usable manner

export const categories = [
  {
    label: "Framework",
    group: categoriesGroups.Frontend,
  },
  {
    label: "CSS",
    group: categoriesGroups.Frontend,
  },
  {
    label: "Auth",
    group: categoriesGroups.Backend,
  },
  {
    label: "RPC",
    group: categoriesGroups.Backend,
  },
  {
    label: "Server",
    group: categoriesGroups.Backend,
  },
  {
    label: "Database",
    group: categoriesGroups.Backend,
  },
  {
    label: "Hosting",
    group: categoriesGroups.Backend,
  },
  {
    label: "Linter",
    multiple: true,
    group: categoriesGroups.Tools,
  },
  {
    label: "Analytics",
    group: categoriesGroups.Tools,
  },
  {
    label: "Error tracking",
    group: categoriesGroups.Tools,
  },
] as const satisfies ReadonlyArray<Category>;

export type CategoryLabels = (typeof categories)[number]["label"];
