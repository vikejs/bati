declare global {
  // eslint-disable-next-line no-var
  var zaraz: Zaraz | undefined;
}

/**
 * This signature is compatible with both Umami and GA
 */
export function track<T extends TrackingEvent>(name: T["name"], data: T["data"]) {
  globalThis.zaraz?.track(name, data);
}

interface Zaraz {
  track: <T extends TrackingEvent>(event: T["name"], data: unknown) => Promise<void>;
}

type TrackingEvent = CopyEvent;

export interface CopyEvent {
  name: "copy_scaffold";
  data: {
    package_manager: string;
    // could be interesting, but maybe tracking
    // button clicks as part of a funnel is better
    // is_preset: boolean;
    [key: string]: string;
  };
}

type FeatureFlag = {
  flag: string;
  category: string;
};

export function formatFeatureFlags(selectedFlags: FeatureFlag[]): Record<string, string> {
  const categoriesMultiple = new Set<string>();

  const flags = selectedFlags.reduce(
    (data, { flag, category }) => {
      if (data[category]) {
        if (Array.isArray(data[category])) {
          data[category].push(flag);
        } else {
          // Track all keys converted to arrays
          categoriesMultiple.add(category);
          data[category] = [data[category], flag];
        }
      } else {
        data[category] = flag;
      }
      return data;
    },
    {} as Record<string, string | string[]>,
  );

  // Recombine all arrays into strings
  categoriesMultiple.forEach((category) => {
    if (Array.isArray(flags[category])) {
      flags[category] = flags[category].sort().join(":");
    }
  });

  return flags as Record<string, string>;
}
