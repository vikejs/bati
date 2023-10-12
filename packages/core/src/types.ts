import type { Flags } from "@batijs/features";

export type ContentGetter = () => string | Promise<string>;

export interface VikeMeta {
  BATI_MODULES?: Flags[];
}

export type TransformerProps = {
  readfile?: ContentGetter;
  target: string;
  source: string;
  meta: VikeMeta;
};

export type Transformer = (props: TransformerProps) => unknown;
