import { categoriesGroups } from "./groups.js";
import type { Category } from "./types.js";

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
    label: "Analytics",
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
    label: "Error tracking",
    group: categoriesGroups.Tools,
  },
] as const satisfies ReadonlyArray<Category>;

export type CategoryLabels = (typeof categories)[number]["label"];
