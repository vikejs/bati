import { arrow, autoUpdate, flip, offset, shift, type Placement } from "@floating-ui/dom";
import clsx from "clsx";
import { createSignal, onMount, type JSX } from "solid-js";
import { useFloating } from "../lib/floating-solid";

export function Tooltip(props: { children?: JSX.Element; class?: string; tip: string }) {
  return props.tip ? (
    <div class={clsx("tooltip", props.class)} data-tip={props.tip}>
      {props.children}
    </div>
  ) : (
    props.children
  );
}

export function EnrichedTooltip(props: {
  children: JSX.Element;
  class?: string;
  tooltipClass?: string;
  tip: JSX.Element;
  placement: Placement;
  arrow?: boolean;
}) {
  const [reference, setReference] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  const [arrowEl, setArrow] = createSignal<HTMLElement>();
  const middlewares = [offset(16), flip(), shift()];
  if (props.arrow) {
    middlewares.push(arrow(() => ({ element: arrowEl()! })));
  }
  const position = useFloating(reference, floating, {
    placement: props.placement,
    whileElementsMounted: autoUpdate,
    middleware: middlewares,
  });

  onMount(() => {
    position.update();
  });

  return (
    <div class={clsx("dropdown dropdown-hover", props.class)}>
      <div
        tabindex="-1"
        ref={setReference}
        onclick={(e) => "blur" in e.target && typeof e.target.blur === "function" && e.target.blur()}
      >
        {props.children}
      </div>
      <div
        tabindex="-1"
        role="tooltip"
        ref={setFloating}
        class={clsx(
          "card compact dropdown-content z-10 shadow-md bg-neutral text-neutral-content rounded-lg flex-row items-center absolute",
          props.tooltipClass,
        )}
        style={{
          position: position.strategy,
          top: position.y ? position.y + "px" : 0,
          left: position.x ? position.x + "px" : 0,
        }}
      >
        <div tabindex="-1" class="p-2 text-sm w-full">
          {props.tip}
        </div>
        {props.arrow && <div ref={setArrow} class="absolute bg-neutral w-2 h-2 rotate-45" style={position.arrow}></div>}
      </div>
    </div>
  );
}
