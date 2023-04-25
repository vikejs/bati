import type { features } from "./features.js";

export type MaybeContentGetter = (() => string | Promise<string>) | undefined;

export interface VikeMeta {
  VIKE_MODULES?: (typeof features)[number][];
}
