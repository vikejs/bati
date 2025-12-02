import type { BatiSet } from "@batijs/features";

export type ContentGetter = () => string | Promise<string>;

export interface VikeMeta {
  BATI: BatiSet;
  BATI_TEST?: boolean;
  BATI_SKIP_GIT?: boolean;
  BATI_IS_CI?: boolean;
}

export type TransformerProps = {
  readfile?: ContentGetter;
  target: string;
  source: string;
  meta: VikeMeta;
  packageJson: PackageJson;
};

export type Transformer = (props: TransformerProps) => unknown;

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface StringTransformer {
  finalize(): string;
}
