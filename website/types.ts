import type { CategoryLabels, Feature as FeatureBase } from "@batijs/features";

export interface Definition {
  disabled?: boolean;
  inview?: boolean;
  label: CategoryLabels;
  features: Feature[];
}

export interface Feature extends FeatureBase {
  alt?: string;
  value?: string;
  selected?: boolean;
}
