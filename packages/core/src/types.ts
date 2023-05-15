import type { features } from "./features.js";

export type MaybeContentGetter = (() => string | Promise<string>) | undefined;

export interface VikeMeta {
  BATI_MODULES?: (typeof features)[number][];
}
