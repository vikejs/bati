import clsx from "clsx";
import { type JSX } from "solid-js";

export function Tooltip(props: { children?: JSX.Element; class?: string; tip: string }) {
  return (
    <div class={clsx("tooltip", props.class)} data-tip={props.tip}>
      {props.children}
    </div>
  );
}

export function EnrichedTooltip(props: { children: JSX.Element; class?: string; tip: JSX.Element; position: "right" }) {
  return (
    <div class={clsx("dropdown dropdown-hover", props.class)}>
      <div tabindex="0">{props.children}</div>
      <div
        tabindex="0"
        role="tooltip"
        class="card compact dropdown-content z-10 shadow-md bg-base-200 rounded-lg w-96 flex-row items-center"
        classList={{ "left-full ml-4 top-1/2 -translate-y-1/2": props.position === "right" }}
      >
        <div
          class="w-0 h-0"
          classList={{
            "border-t-4 border-b-4 border-t-transparent border-b-transparent border-r-4 border-r-base-200 -translate-x-full":
              props.position === "right",
          }}
        ></div>
        <div tabindex="0" class="p-2 text-sm">
          {props.tip}
        </div>
      </div>
    </div>
  );
}
