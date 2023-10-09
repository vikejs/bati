import type { features } from "./features.js";

export type ContentGetter = () => string | Promise<string>;

export interface VikeMeta {
  BATI_MODULES?: (typeof features)[number][];
}

export type TransformerProps = {
  readfile?: ContentGetter;
  target: string;
  source: string;
  meta: VikeMeta;
};

export type Transformer = (props: TransformerProps) => unknown;
