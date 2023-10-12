import type { Category } from "./types.js";

export const categories = [
  {
    label: "Framework",
  },
  {
    label: "CSS",
  },
  {
    label: "Auth",
  },
  {
    label: "RPC",
  },
  {
    label: "Server",
  },
  {
    label: "Database",
  },
  {
    label: "Analytics",
  },
  {
    label: "Hosting",
  },
  {
    label: "Tools",
    multiple: true,
  },
  {
    label: "Error tracking",
  },
] as const satisfies ReadonlyArray<Category>;

export type CategoryLabels = (typeof categories)[number]["label"];
