import type { VikeMeta } from "@batijs/core";
import type { BatiConfig, BatiConfigStep } from "@batijs/core/config";
import type { Feature } from "@batijs/features";
import type { ArgDef } from "citty";

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

export type BatiArgDef = ArgDef & { invisible?: boolean };

export interface IntegrationContext {
  project: string;
  flags: string[];
  allFeatures: ReadonlyArray<Feature>;
  packageManagerExec: string;
}

export interface Integration {
  flag: string;
  label: string;
  arg: BatiArgDef;
  run: (context: IntegrationContext) => Promise<boolean | void> | boolean | void;
  nextSteps?: (packageManagerRun: string) => BatiConfigStep[];
}
