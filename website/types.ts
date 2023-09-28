export interface Definition {
  disabled?: boolean;
  inview?: boolean;
  label: string;
  features: Feature[];
}

export interface Feature {
  label: string;
  alt?: string;
  value?: string;
  selected?: boolean;
  disabled?: boolean;
  image?: string;
  url?: string;
}
