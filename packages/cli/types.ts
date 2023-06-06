import type { VikeMeta } from "@batijs/core";

export interface BatiConfig {
  flag?: string;
  name?: string;
  homepage?: string;
  boilerplate?: string;
}

export interface BoilerplateDef {
  folder: string;
  config: BatiConfig;
  subfolders: string[];
  description?: string;
}

export interface ToBeCopied extends BoilerplateDef {
  source?: string;
}

export type Hook = (meta: VikeMeta) => Promise<void> | void;
