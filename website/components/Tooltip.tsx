import { autoUpdate, offset, size, type Middleware, type Placement, type ReferenceElement } from "@floating-ui/dom";
import type { Side } from "@floating-ui/utils";
import clsx from "clsx";
import { createEffect, createMemo, createSignal, onMount, Show, type JSX } from "solid-js";
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
  arrow?: boolean;
  disabled?: boolean;
  reference?: ReferenceElement;
}) {
  createEffect(() => {
    if (props.reference) {
      setReference(props.reference);
    }
  });

  const [reference, setReference] = createSignal<ReferenceElement | undefined>(props.reference);
  const [floating, setFloating] = createSignal<HTMLElement>();
  const middlewares: Middleware[] = [
    // flip({
    //   fallbackAxisSideDirection: "end",
    // }),
    offset(({ rects }) => -rects.reference.width - (props.arrow ? 4 : 0)),
    size({
      apply({ elements, rects }) {
        Object.assign(elements.floating.style, {
          width: `${rects.reference.width + (props.arrow ? 4 : 0) + 1}px`,
          minHeight: `${rects.reference.height}px`,
          transition: "transform 300ms",
        });
      },
    }),
  ];
  const position = useFloating(reference, floating, {
    placement: props.placement,
    whileElementsMounted: autoUpdate,
    middleware: middlewares,
    // offset: props.offset,
  });

  const arrowPosition = {
    right: "",
    left: "flex-row-reverse",
    bottom: "flex-col",
    top: "flex-col-reverse",
  };

  const arrowOffset = {
    right: "-mr-1",
    left: "-ml-1",
    bottom: "-mb-1",
    top: "-mt-1",
  };

  onMount(() => {
    position.update();
  });

  const placement = createMemo(() => position.placement.split("-")[0] as Side);

  return (
    <div
      class={clsx("dropdown", props.class)}
      classList={{
        "dropdown-hover": !props.disabled,
      }}
    >
      <div
        ref={(x) => !props.reference && setReference(x)}
        class={clsx(props.class)}
        onclick={(e) => "blur" in e.target && typeof e.target.blur === "function" && e.target.blur()}
      >
        {props.children}
      </div>
      <div
        role="tooltip"
        ref={setFloating}
        class={clsx("dropdown-content z-10 absolute bg-transparent flex", arrowPosition[placement()])}
        style={position.modal}
      >
        <Show when={props.arrow}>
          <div class="flex items-center justify-center">
            <div
              class={clsx("bg-base-200 w-2 h-2 rotate-45 border-l border-b border-neutral", arrowOffset[placement()])}
            ></div>
          </div>
        </Show>
        <div
          class={clsx(
            "shadow shadow-base-300 backdrop-blur-md bg-base-200/30 dark:bg-neutral/70 rounded-md flex-row items-center",
            props.tooltipClass,
          )}
        >
          {props.tip}
        </div>
      </div>
    </div>
  );
}
