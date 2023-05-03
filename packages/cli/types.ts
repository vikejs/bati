export interface BatiConfig {
  flag?: string;
  boilerplate?: string;
  features?: string[];
}

export interface BoilerplateDef {
  folder: string;
  config: BatiConfig;
  source: string;
}
