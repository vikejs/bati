import { createMemo, createSignal, For, Show, type JSX } from "solid-js";
import type { Feature } from "../types";

// TODO move to context
const [selected, setSelected] = createSignal("");

export function FormControl(props: {
  children: JSX.Element;
  label: string;
  features: Feature[];
  flipLabel?: string;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLFieldSetElement>["classList"];
  style?: string;
}) {
  const isSelected = createMemo(() => selected() === props.label);

  return (
    <>
      <button
        type="button"
        role="tab"
        aria-selected={isSelected()}
        class="group row-auto btn font-normal px-2 h-32 card items-start rounded-md shadow hover:scale-105 hover:bg-base-100/40"
        classList={{
          "btn-active bg-base-100/40 outline !outline-primary outline-offset-2": isSelected(),
          "bg-base-100": !isSelected(),
        }}
        onclick={(e) => {
          setSelected(isSelected() ? "" : props.label);
        }}
      >
        <div class="grid grid-cols-1 justify-items-start card-body p-0">
          <div class="card-title">{props.label}</div>
          <div class="flex flex-row flex-wrap self-start gap-1">
            <For each={props.features}>
              {(feature) => (
                <span
                  class="badge badge-ghost rounded-md badge-lg gap-1"
                  classList={{
                    "!badge-primary": feature.selected,
                  }}
                >
                  <Show when={feature.image}>
                    <img class="w-4 h-4" src={feature.image} />
                  </Show>
                  {feature.label}
                </span>
              )}
            </For>
          </div>
        </div>
      </button>
      <Show when={isSelected()}>
        <div role="tabpanel" class="mx-4 row-auto bg-base-100 rounded-md pl-2 pr-6 py-4 col-span-full shadow-inner">
          {props.children}
        </div>
      </Show>
    </>
  );
}
