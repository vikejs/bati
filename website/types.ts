import type { Feature as FeatureBase } from "@batijs/features";

export interface Feature extends FeatureBase {
  alt?: string;
  selected?: boolean;
}
