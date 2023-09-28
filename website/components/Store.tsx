import { execRules } from "@batijs/core/rules";
import { batch, createContext, createMemo, type JSX } from "solid-js";
import { createStore } from "solid-js/store";
import features from "../assets/features.json";
import type { Definition, Feature } from "../types.js";
import { rulesMessages } from "./RulesMessages.js";

export type FeaturesType = keyof typeof features;
export type FeaturesAll = `${FeaturesType}:${string}`;

function filteredObject<T extends object>(obj: T, filter: (obj: T, k: keyof T) => boolean) {
  return Object.keys(obj).reduce(function (r, e) {
    if (filter(obj, e as keyof T)) r[e as keyof T] = obj[e as keyof T];
    return r;
  }, {} as Partial<T>);
}

function initStore() {
  const [currentFeatures, setCurrentFeatures] = createStore<Record<FeaturesType, Definition>>(features);

  const inViewFeatures = createMemo(() => filteredObject(currentFeatures, (o, k) => Boolean(o[k].inview)));

  function moveFeature(k: FeaturesType) {
    setCurrentFeatures(k, "inview", (val) => !val);
  }

  function selectFeature(k: FeaturesType, value: unknown) {
    setCurrentFeatures(k, "features", (fs) => {
      return fs.map((f) => ({
        ...f,
        selected: value
          ? value === f.value
          : (features as Record<string, Definition>)[k].features.find((f2) => f2.value === f.value)?.selected,
      }));
    });
  }

  const featuresValues = createMemo<Record<string, string | undefined>>(() =>
    Object.assign(
      {},
      ...Object.entries(inViewFeatures()).map(([ns, fs]) => ({
        [ns]: fs.features.find((f) => f.selected)?.value,
      })),
    ),
  );

  const selectedFeatures = createMemo<Feature[]>(
    () =>
      Object.values(inViewFeatures())
        .map((fs) => fs.features.find((f) => f.selected))
        .filter(Boolean) as Feature[],
  );

  function selectPreset(ks: (FeaturesType | FeaturesAll)[]) {
    const nms: FeaturesType[] = ks.map((k) =>
      k.includes(":") ? (k.split(":")[0] as FeaturesType) : (k as FeaturesType),
    );

    const fts: FeaturesAll[] = ks.filter((k): k is FeaturesAll => k.includes(":"));

    batch(() => {
      (Object.keys(currentFeatures) as FeaturesType[]).forEach((k) => {
        setCurrentFeatures(k, "inview", nms.includes(k));
      });
      fts.forEach((ft) => {
        const [namespace, f] = ft.split(":");
        selectFeature(namespace as FeaturesType, f);
      });
    });
  }

  const inViewFlagsWithNs = createMemo<string[]>(
    () =>
      Object.entries(inViewFeatures())
        .map(([ns, fs]) => fs.features.filter((f) => f.selected).map((f) => `${ns}:${f.value}`))
        .flat(1)
        .filter(Boolean) as string[],
  );

  const rules = createMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = execRules(inViewFlagsWithNs() as any[], rulesMessages);

    return {
      size: r.length,
      error: r.filter((x) => x.type === "error").map((x) => x.value),
      warning: r.filter((x) => x.type === "warning").map((x) => x.value),
      info: r.filter((x) => x.type === "info").map((x) => x.value),
    };
  });

  return {
    inViewFeatures,
    moveFeature,
    selectFeature,
    featuresValues,
    selectedFeatures,
    currentFeatures,
    selectPreset,
    inViewFlagsWithNs,
    rules,
  };
}

export const StoreContext = createContext<ReturnType<typeof initStore>>(
  undefined as unknown as ReturnType<typeof initStore>,
);

export function StoreProvider(props: { children: JSX.Element }) {
  const store = initStore();

  return <StoreContext.Provider value={store}>{props.children}</StoreContext.Provider>;
}
