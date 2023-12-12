import { categories, categoriesGroups, type Category, type CategoryLabels } from "@batijs/features";
import { FormControl } from "#components/FormControl.js";
import { IconAlembic, IconTrainTrack } from "#components/Icons";
import { StoreContext } from "#components/Store.js";
import { EnrichedTooltip } from "#components/Tooltip";
import { createMemo, For, useContext } from "solid-js";

function FeaturesGroup(props: { categories: Category[] }) {
  const { currentFeatures, selectFeature } = useContext(StoreContext);

  return (
    <div
      id="bati-features"
      class="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-x-4 box-border w-full relative"
    >
      <For each={props.categories}>
        {({ label, multiple }) => {
          const fs = createMemo(() => currentFeatures.filter((f) => f.category === label));
          const inview = createMemo(() => fs().some((x) => x.selected));
          const disabled = createMemo(() => fs().every((x) => x.disabled));

          return (
            <FormControl
              label={label}
              flipLabel={label}
              class="w-full sm:w-auto rounded-md bg-base-100"
              classList={{
                "border-success/60": inview(),
                "border-base-200 opacity-70": disabled(),
                "border-primary/60": !inview() && !disabled(),
                "border-solid border-l-2": !multiple,
              }}
            >
              <div class="grid grid-rows-3 w-full gap-2 py-2 h-32 -mt-3">
                <For each={fs()}>
                  {(feature) => (
                    <label
                      class="flex px-2.5"
                      classList={{
                        "opacity-50 cursor-not-allowed": disabled() || feature.disabled,
                        "border-success/60": inview() && feature.selected,
                        "border-primary/60": !inview() || !feature.selected,
                        "border-solid border-l-2": multiple,
                      }}
                    >
                      <div class="flex justify-center items-center pr-2.5">
                        <input
                          type="checkbox"
                          checked={inview() && feature.selected}
                          classList={{
                            "checkbox-success": Boolean(inview() && feature.selected),
                            "border-solid": !(disabled() || feature.disabled),
                          }}
                          class="checkbox rounded"
                          disabled={disabled() || feature.disabled}
                          onChange={() => {
                            selectFeature(label as CategoryLabels, feature.flag, !feature.selected);
                          }}
                        />
                      </div>
                      <div class="inline-flex gap-2 items-center w-full group">
                        {feature.image && (
                          <img class="max-w-5 max-h-5" src={feature.image} alt={`${feature.label} logo`} />
                        )}
                        <div class="inline-flex flex-col gap-0 leading-5">
                          <span>{feature.label}</span>
                          {feature.alt && <span class="text-xs">{feature.alt}</span>}
                        </div>
                        {/*{!feature.disabled && (*/}
                        {/*  <Tooltip*/}
                        {/*    tip="Hello"*/}
                        {/*    class="flex-shrink opacity-0 group-hover:opacity-100 transition-opacity -mr-3"*/}
                        {/*  >*/}
                        {/*    <IconInfo class="opacity-70"></IconInfo>*/}
                        {/*  </Tooltip>*/}
                        {/*)}*/}
                        <div class="flex-1"></div>
                        {feature.spectrum === "beaten_path" && (
                          <EnrichedTooltip
                            tip={<BeatenPathTooltip />}
                            placement="right"
                            class="w-4"
                            tooltipClass="w-72 lg:w-96 h-20 lg:h-16"
                            arrow={true}
                          >
                            <IconTrainTrack class="opacity-80"></IconTrainTrack>
                          </EnrichedTooltip>
                        )}
                        {feature.spectrum === "bleeding_edge" && (
                          <EnrichedTooltip
                            tip={<BleedingEdgeTooltip />}
                            placement="right"
                            class="w-4"
                            tooltipClass="w-72 lg:w-96 h-20 lg:h-16"
                            arrow={true}
                          >
                            <IconAlembic class="opacity-80"></IconAlembic>
                          </EnrichedTooltip>
                        )}
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
  return (
    <>
      <For each={Object.values(categoriesGroups)}>
        {(group) => (
          <>
            <div class="divider divider-start mb-0 mt-5">
              <h3 class="font-bold uppercase text-sm tracking-wider text-neutral-500">{group}</h3>
            </div>
            <FeaturesGroup categories={categories.filter((c) => c.group === group)} />
          </>
        )}
      </For>
    </>
  );
}

function BeatenPathTooltip() {
  return (
    <p>
      <IconTrainTrack class="max-w-4 max-h-4 opacity-80 inline align-baseline mr-1"></IconTrainTrack> Battle-Tested
      Solution: time-proven library, an industry favorite known for its reliability and widespread adoption.
    </p>
  );
}

function BleedingEdgeTooltip() {
  return (
    <p>
      <IconAlembic class="max-w-4 max-h-4 opacity-80 inline align-baseline mr-1"></IconAlembic> Stay Ahead of the Game:
      bleeding-edge library for unparalleled features and performance.
    </p>
  );
}
