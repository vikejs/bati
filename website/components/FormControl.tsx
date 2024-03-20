import { createMemo, createSignal, Show, type JSX } from "solid-js";

// TODO move to context
const [selected, setSelected] = createSignal("");

export function FormControl(props: {
  children: JSX.Element;
  label: string;
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
        class="tab row-auto btn font-normal border-0"
        classList={{
          "tab-active": isSelected(),
        }}
        onclick={(e) => {
          setSelected(isSelected() ? "" : props.label);
        }}
      >
        {props.label}
      </button>
      <Show when={isSelected()}>
        <div role="tabpanel" class="tab-content row-auto bg-base-100 border-base-300 rounded-box p-6 col-span-full">
          {props.children}
        </div>
      </Show>
    </>
  );
}
