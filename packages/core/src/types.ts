import type { Flags } from "@batijs/features";

export type ContentGetter = () => string | Promise<string>;

export interface VikeMeta {
  BATI: Set<Flags>;
  BATI_TEST: boolean;
}

export type TransformerProps = {
  readfile?: ContentGetter;
  target: string;
  source: string;
  meta: VikeMeta;
};

export type Transformer = (props: TransformerProps) => unknown;
