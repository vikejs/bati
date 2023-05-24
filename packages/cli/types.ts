export interface BatiConfig {
  flag?: string;
  name?: string;
  homepage?: string;
  boilerplate?: string;
}

export interface BoilerplateDef {
  folder: string;
  config: BatiConfig;
  description?: string;
  source?: string;
}
