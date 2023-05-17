export interface BatiConfig {
  flag?: string;
  boilerplate?: string;
}

export interface BoilerplateDef {
  folder: string;
  config: BatiConfig;
  description?: string;
  source?: string;
}
