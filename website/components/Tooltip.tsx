import { autoUpdate, flip, offset, shift, type Placement } from "@floating-ui/dom";
import clsx from "clsx";
import { createSignal, onMount, type JSX } from "solid-js";
import { useFloating } from "../lib/floating-solid";

export function Tooltip(props: { children?: JSX.Element; class?: string; tip: string }) {
  return (
    <div class={clsx("tooltip", props.class)} data-tip={props.tip}>
      {props.children}
    </div>
  );
}

export function EnrichedTooltip(props: {
  children: JSX.Element;
  class?: string;
  tip: JSX.Element;
  placement: Placement;
}) {
  const [reference, setReference] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  const position = useFloating(reference, floating, {
    placement: props.placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(16), flip(), shift()],
  });

  onMount(() => {
    position.update();
  });

  return (
    <div class={clsx("dropdown dropdown-hover", props.class)}>
      <div tabindex="0" ref={setReference}>
        {props.children}
      </div>
      <div
        tabindex="0"
        role="tooltip"
        ref={setFloating}
        class="card compact dropdown-content z-10 shadow-md bg-neutral text-neutral-content rounded-lg flex-row items-center absolute top-o left-0 w-72 lg:w-96"
        style={{
          position: position.strategy,
          top: position.y ? position.y + "px" : 0,
          left: position.x ? position.x + "px" : 0,
        }}
      >
        <div tabindex="0" class="p-2 text-sm">
          {props.tip}
        </div>
      </div>
    </div>
  );
}
