import { FormControl } from "#components/FormControl.js";
import { type FeaturesType, StoreContext } from "#components/Store.js";
import { createMemo, For, useContext } from "solid-js";

function FeaturesGroup(props: { keys: FeaturesType[] }) {
  const { currentFeatures, selectFeature, moveFeature } = useContext(StoreContext);

  return (
    <div class="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-x-4 box-border w-full relative">
      <For each={props.keys}>
        {(ns) => {
          const f = currentFeatures[ns];
          return (
            <FormControl
              label={f.label}
              flipLabel={ns}
              class="w-full sm:w-auto border-solid border-l-2 rounded-md bg-base-100"
              classList={{
                "border-success/60": Boolean(f.inview),
                "border-base-200 opacity-70": Boolean(f.disabled),
                "border-primary/60": !f.inview && !f.disabled,
              }}
            >
              <div class="grid grid-rows-3 group w-full gap-2 py-2 h-32 -mt-3">
                <For each={f.features}>
                  {(feature) => (
                    <label
                      class="flex"
                      classList={{
                        "opacity-50 cursor-not-allowed": f.disabled || feature.disabled,
                      }}
                    >
                      <div class="flex justify-center items-center px-2.5">
                        <input
                          type="checkbox"
                          checked={f.inview && feature.selected}
                          classList={{
                            "checkbox-success": Boolean(f.inview && feature.selected),
                            "border-solid": !(f.disabled || feature.disabled),
                          }}
                          class="checkbox rounded"
                          disabled={f.disabled || feature.disabled}
                          onChange={(event) => {
                            selectFeature(ns, feature.value);
                            if (!f.inview || !event.currentTarget.checked) {
                              moveFeature(ns);
                            }
                          }}
                        />
                      </div>
                      <div class="inline-flex gap-2 items-center w-full">
                        {feature.image && (
                          <img class="max-w-5 max-h-5" src={feature.image} alt={`${feature.value} logo`} />
                        )}
                        <div class="inline-flex flex-col gap-0 leading-5">
                          <span>{feature.label}</span>
                          {feature.alt && <span class="text-xs">{feature.alt}</span>}
                        </div>
                      </div>
                    </label>
                  )}
                </For>
              </div>
            </FormControl>
          );
        }}
      </For>
    </div>
  );
}

export default function Features() {
  const { currentFeatures } = useContext(StoreContext);

  const keys = createMemo(() => Object.keys(currentFeatures) as FeaturesType[]);
  // TODO proper split + categorization
  const keysFront = createMemo(() => keys().filter((ns) => ns === "framework" || ns === "uikit"));
  const keysTools = createMemo(() => keys().filter((ns) => ns === "tool"));
  const keysBack = createMemo(() => keys().filter((ns) => ns !== "framework" && ns !== "uikit" && ns !== "tool"));

  return (
    <>
      <div class="divider-l">
        <h3 class="font-bold uppercase text-sm tracking-wider text-neutral-500">Frontend</h3>
      </div>
      <FeaturesGroup keys={keysFront()} />
      <div class="divider-l">
        <h3 class="font-bold uppercase text-sm tracking-wider text-neutral-500">Backend</h3>
      </div>
      <FeaturesGroup keys={keysBack()} />
      <div class="divider-l">
        <h3 class="font-bold uppercase text-sm tracking-wider text-neutral-500">Tools</h3>
      </div>
      <FeaturesGroup keys={keysTools()} />
    </>
  );
}
