export interface BatiConfig {
  flags?: Record<string, string[]>;
  boilerplate?: string;
}

export interface BoilerplateDef {
  folder: string;
  config: BatiConfig;
  source: string;
}
