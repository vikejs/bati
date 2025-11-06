import type { VikeMeta } from "@batijs/core";

export interface BatiConfig {
  if?: Record<string, unknown>;
  enforce?: "pre" | "post";
}

export interface BoilerplateDef {
  folder: string;
  config: BatiConfig;
  subfolders: string[];
  hasSetupSteps?: boolean;
}

export interface ToBeCopied extends BoilerplateDef {
  source?: string;
}

export type Hook = (cwd: string, meta: VikeMeta) => Promise<void> | void;
