import { categories, categoriesGroups, type Category, type CategoryLabels, type FeatureLink } from "@batijs/features";
import type { VirtualElement } from "@floating-ui/dom";
import { FormControl } from "#components/FormControl.js";
import { IconAlembic, IconTrainTrack } from "#components/Icons";
import { ShieldBadge } from "#components/ShieldBadge";
import { StoreContext } from "#components/Store.js";
import { EnrichedTooltip } from "#components/Tooltip";
import { createMemo, createSignal, For, Match, Show, Switch, useContext, type Accessor, type JSX } from "solid-js";
import { Motion } from "solid-motionone";
import type { Feature } from "../types.js";

export default function Features() {
  return (
    <div
      id="bati-features"
      class="grid grid-cols-1 lg:grid-cols-2 grid-flow-dense gap-4 box-border relative bg-transparent mt-4"
    >
      <For each={Object.values(categoriesGroups)}>
        {(group) => {
          const currentCategories = createMemo(() => categories.filter((c) => c.group === group));

          return (
            <FormControl
              label={group}
              flipLabel={group}
              //FIXME: features={fs()}
              categories={currentCategories()}
              class="w-full sm:w-auto rounded-md"
            >
              <div class="flex flex-col relative gap">
                <For each={currentCategories()}>{(category) => <CategoryGroup {...category} />}</For>
              </div>
            </FormControl>
          );
        }}
      </For>
    </div>
  );
}

function CategoryGroup(props: Category) {
  const { currentFeatures } = useContext(StoreContext);

  const fs = createMemo(() => currentFeatures.filter((f) => f.category === props.label));
  const [reference, setReference] = createSignal<VirtualElement>();

  return (
    <>
      <div class="divider divider-start">{props.label}</div>
      <div class="flex flex-col lg:flex-row relative">
        <div class="basis-1/4 w-full gap-y-2">
          <For each={fs()}>
            {(feature) => <FeatureGroup feature={feature} category={props} reference={reference}></FeatureGroup>}
          </For>
        </div>
        <div class="basis-3/4">
          <DetailsFallback
            description={props.description}
            ref={(x: HTMLElement) => {
              const virtualEl = {
                getBoundingClientRect() {
                  return x.getBoundingClientRect();
                },
                contextElement: x,
              };

              setReference(virtualEl);
            }}
          />
        </div>
      </div>
    </>
  );
}

function FeatureGroup(props: {
  feature: Feature;
  category: Category;
  reference: Accessor<VirtualElement | undefined>;
}) {
  const { selectFeature } = useContext(StoreContext);

  return (
    <EnrichedTooltip
      tip={<CombinedTooltip feature={props.feature} />}
      class={"w-full px-1.5"}
      placement="right-start"
      arrow={true}
      tooltipClass="text-sm p-0 w-full border-l-2 border-neutral-300 dark:border-neutral-500 shadow-md shadow-base-300 backdrop-blur-md bg-base-300/30 dark:bg-neutral/70"
      arrowClass="shadow shadow-base-300 bg-neutral-300 dark:bg-neutral-500"
      disabled={props.feature.disabled}
      withReference={true}
      reference={props.reference()}
    >
      <label
        class="group flex items-center cursor-pointer h-12 min-w-60 col-start-1 lg:mr-4"
        classList={{
          "opacity-50 cursor-not-allowed": props.feature.disabled,
        }}
      >
        <div class="flex justify-center items-center pr-2.5">
          <input
            aria-describedby="details"
            type="checkbox"
            checked={props.feature.selected}
            classList={{
              "checkbox-success": Boolean(props.feature.selected),
              "border-solid": !props.feature.disabled,
              rounded: props.category.multiple,
              "rounded-full": !props.category.multiple,
            }}
            class="checkbox"
            disabled={props.feature.disabled}
            onChange={() => {
              selectFeature(props.category.label as CategoryLabels, props.feature.flag, !props.feature.selected);
            }}
          />
        </div>

        <div class="inline-flex gap-2 items-center w-full group">
          {props.feature.image && (
            <img class="max-w-5 max-h-5" src={props.feature.image} alt={`${props.feature.label} logo`} />
          )}
          <div class="inline-flex flex-col gap-0 leading-5">
            <span>{props.feature.label}</span>
            {props.feature.alt && <span class="text-xs">{props.feature.alt}</span>}
          </div>
          <div class="flex-1"></div>
          {props.feature.spectrum === "beaten_path" && <IconTrainTrack class="w-4 opacity-80"></IconTrainTrack>}
          {props.feature.spectrum === "bleeding_edge" && <IconAlembic class="w-4 opacity-80"></IconAlembic>}
        </div>
      </label>
    </EnrichedTooltip>
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

function DetailsFallback(props: { description?: string; ref?: JSX.CustomAttributes<HTMLDivElement>["ref"] }) {
  return (
    <Motion.div
      exit={{ opacity: 0 }}
      class="flex-1 rounded-md shadow-inner shadow-base-300 bg-base-200 h-full py-2 px-3 ml-4 lg:ml-0"
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, easing: "ease-in-out" }}
      ref={props.ref}
    >
      {props.description}
    </Motion.div>
  );
}
