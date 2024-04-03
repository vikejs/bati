import { categories, type Category, type CategoryLabels } from "@batijs/features";
import type { FeatureLink } from "@batijs/features/src/index";
import { FormControl } from "#components/FormControl.js";
import { IconAlembic, IconTrainTrack } from "#components/Icons";
import { ShieldBadge } from "#components/ShieldBadge";
import { StoreContext } from "#components/Store.js";
import { EnrichedTooltip } from "#components/Tooltip";
import { createMemo, For, Match, Show, Switch, useContext } from "solid-js";
import { Motion } from "solid-motionone";
import type { Feature } from "../types";

function FeaturesGroup(props: { categories: ReadonlyArray<Category> }) {
  const { currentFeatures, selectFeature } = useContext(StoreContext);

  return (
    <div
      id="bati-features"
      role="tablist"
      class="tabs tabs-boxed gap-4 box-border relative grid-cols-[repeat(auto-fill,_minmax(16rem,_1fr))] grid-flow-dense overflow-hidden bg-transparent p-1 mt-4"
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
              features={fs()}
              class="w-full sm:w-auto rounded-md bg-base-100"
            >
              <div class="flex relative gap-x-2">
                <div class="basis-1/4 w-full gap-y-2 pl-2">
                  <For each={fs()}>
                    {(feature) => (
                      <>
                        <EnrichedTooltip
                          tip={<CombinedTooltip feature={feature} />}
                          class={"w-full px-1.5"}
                          placement="right"
                          arrow={true}
                          offset={0}
                          tooltipClass="w-72 lg:w-96 text-sm p-0"
                          disabled={feature.disabled}
                        >
                          <label
                            class="group flex items-center cursor-pointer h-12 min-w-60 col-start-1"
                            classList={{
                              "opacity-50 cursor-not-allowed": disabled() || feature.disabled,
                            }}
                          >
                            <div class="flex justify-center items-center pr-2.5">
                              <input
                                aria-describedby="details"
                                type="checkbox"
                                checked={inview() && feature.selected}
                                classList={{
                                  "checkbox-success": Boolean(inview() && feature.selected),
                                  "border-solid": !(disabled() || feature.disabled),
                                  rounded: multiple,
                                  "rounded-full": !multiple,
                                }}
                                class="checkbox"
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
                            </div>
                          </label>
                        </EnrichedTooltip>
                      </>
                    )}
                  </For>
                </div>
                <div class="basis-3/4 flex bg-base-100">
                  <DetailsFallback />
                </div>
              </div>
            </FormControl>
          );
        }}
      </For>
    </div>
  );
}

export default function Features() {
  return <FeaturesGroup categories={categories} />;
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

function CombinedTooltip(props: { feature: Feature }) {
  const links: FeatureLink[] = [];
  if (props.feature.url) {
    links.push({
      label: "Homepage",
      href: props.feature.url,
    });
  }
  if (props.feature.links) {
    links.push(...props.feature.links);
  }

  return (
    <div class="rounded-md relative h-full" role="tooltip" id="details">
      <div class="px-3 pb-2 pt-1">
        <div class="flex items-baseline">
          <h2 class="text-primary text-lg font-bold">{props.feature.label}</h2>
          <span class="flex-1"></span>
          <ShieldBadge repo={props.feature.repo} />
        </div>

        <Show when={props.feature.tagline}>
          <div class="opacity-60">{props.feature.tagline}</div>
        </Show>
        <Show when={links.length > 0}>
          <ul class="list-custom list-check inline-flex gap-2 my-2 flex-wrap">
            <For each={links}>
              {(link) => (
                <ul>
                  <a href={link.href} class="link" target="_blank" tabindex="0">
                    {link.label}
                  </a>
                </ul>
              )}
            </For>
          </ul>
        </Show>
      </div>
      <Show when={props.feature.spectrum}>
        <div class="mx-1 p-2 border-dashed border-t-2 border-t-neutral italic">
          <Switch>
            <Match when={props.feature.spectrum === "beaten_path"}>
              <BeatenPathTooltip />
            </Match>
            <Match when={props.feature.spectrum === "bleeding_edge"}>
              <BleedingEdgeTooltip />
            </Match>
          </Switch>
        </div>
      </Show>
    </div>
  );
}

function DetailsFallback() {
  return (
    <Motion.div
      exit={{ opacity: 0 }}
      class="flex-1"
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, easing: "ease-in-out" }}
    >
      It’s recommended to choose a frontend lib to kickstart a new Vike project, as they come with a wide range of
      integrations. You can at any time eject and take control over integration code so that it doesn’t get in your way.
      That being said, you can also choose to
    </Motion.div>
  );
}
