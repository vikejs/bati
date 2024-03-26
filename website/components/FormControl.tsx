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
        class="tab row-auto btn font-normal border-0 h-32"
        classList={{
          "tab-active": isSelected(),
        }}
        onclick={(e) => {
          setSelected(isSelected() ? "" : props.label);
        }}
      >
        {props.label}
        <br />
        <For each={props.features}>{(feature) => feature.label}</For>
      </button>
      <Show when={isSelected()}>
        <div role="tabpanel" class="tab-content row-auto bg-base-100 border-base-300 rounded-box p-6 col-span-full">
          {props.children}
        </div>
      </Show>
    </>
  );
}
