import { categories, type Category, type CategoryLabels, features, type Flags } from "@batijs/features";
import { execRules } from "@batijs/features/rules";
import { batch, createContext, createMemo, type JSX } from "solid-js";
import { createStore } from "solid-js/store";
import type { Feature } from "../types.js";
import { rulesMessages } from "./RulesMessages.js";

function initStore() {
  const featuresInitialState: Feature[] = features.map((f: Feature) => ({
    ...f,
    alt: f.disabled ? "Coming soon" : undefined,
    selected: Boolean(f.readonly),
  }));

  const [currentFeatures, setCurrentFeatures] = createStore<Feature[]>(featuresInitialState);

  function selectFeature(k: CategoryLabels, flag: string, selected: boolean) {
    const multiple = (categories as ReadonlyArray<Category>).find((c) => c.label === k)?.multiple;

    if (!multiple) {
      batch(() => setCurrentFeatures((f) => f.category === k && !f.readonly, "selected", false));
    }

    setCurrentFeatures((f) => f.flag === flag, "selected", selected);
  }

  const selectedFeatures = createMemo<Feature[]>(() => currentFeatures.filter((f) => f.selected));

  const selectedFeaturesFlags = createMemo(() =>
    selectedFeatures()
      .filter((f) => !f.invisibleCli)
      .map((f) => f.flag),
  );

  function selectPreset(ks: (Flags | CategoryLabels)[]) {
    batch(() => {
      for (const initialFeature of featuresInitialState) {
        if (ks.includes(initialFeature.category as CategoryLabels)) {
          const firstIndexOfCategory = featuresInitialState.findIndex((f) => f.category === initialFeature.category);
          setCurrentFeatures(
            (f) => f.category === initialFeature.category && !f.readonly,
            "selected",
            (_, [__, i]) => {
              return i === firstIndexOfCategory;
            },
          );
        } else if (ks.includes(initialFeature.flag as Flags)) {
          setCurrentFeatures((f) => f.flag === initialFeature.flag && !f.readonly, "selected", true);
        } else {
          setCurrentFeatures((f) => f.flag === initialFeature.flag && !f.readonly, "selected", false);
        }
      }
    });
  }

  const selectedFlags = createMemo<Flags[]>(() => selectedFeatures().map((f) => f.flag as Flags));

  const rules = createMemo(() => {
    const r = execRules(selectedFlags(), rulesMessages);

    return {
      size: r.length,
      error: r.filter((x) => x.type === "error").map((x) => x.value),
      warning: r.filter((x) => x.type === "warning").map((x) => x.value),
      info: r.filter((x) => x.type === "info").map((x) => x.value),
      invisible: r.filter((x) => x.type === "invisible").map((x) => x.value),
    };
  });

  return {
    selectedFeaturesFlags,
    selectFeature,
    selectedFeatures,
    currentFeatures,
    selectPreset,
    selectedFlags,
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
