import { arrow, autoUpdate, flip, type Placement } from "@floating-ui/dom";
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
  offset?: number;
  offsetArrow?: number;
  arrow?: boolean;
}) {
  const [reference, setReference] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  const [arrowEl, setArrow] = createSignal<HTMLElement>();
  const middlewares = [
    flip({
      fallbackAxisSideDirection: "end",
    }),
  ];
  if (props.arrow) {
    middlewares.push(arrow(() => ({ element: arrowEl()! })));
  }
  const position = useFloating(reference, floating, {
    placement: props.placement,
    whileElementsMounted: autoUpdate,
    middleware: middlewares,
    offset: props.offset,
    offsetArrow: props.offsetArrow,
  });

  onMount(() => {
    position.update();
  });

  return (
    <div class={clsx("dropdown dropdown-hover", props.class)}>
      <div
        tabindex="-1"
        ref={setReference}
        class={clsx(props.class)}
        onclick={(e) => "blur" in e.target && typeof e.target.blur === "function" && e.target.blur()}
      >
        {props.children}
      </div>
      <div
        tabindex="-1"
        role="tooltip"
        ref={setFloating}
        class={clsx("dropdown-content z-10 absolute p-4 bg-transparent", props.tooltipClass)}
        style={position.modal}
      >
        <div class="shadow-md bg-neutral text-neutral-content rounded-lg flex-row items-center">
          <div tabindex="-1" class="text-sm w-full">
            {props.tip}
          </div>
          {props.arrow && (
            <div ref={setArrow} class="absolute bg-neutral w-2 h-2 rotate-45" style={position.arrow}></div>
          )}
        </div>
      </div>
    </div>
  );
}
