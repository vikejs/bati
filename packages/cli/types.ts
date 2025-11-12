import type { VikeMeta } from "@batijs/core";
import type { BatiConfig } from "@batijs/core/config";

export interface BoilerplateDef {
  folder: string;
  subfolders: string[];
}

export interface BoilerplateDefWithConfig {
  folder: string;
  subfolders: string[];
  config: BatiConfig;
}

export interface ToBeCopied extends BoilerplateDef {
  source?: string;
}

export type Hook = (cwd: string, meta: VikeMeta) => Promise<void> | void;
