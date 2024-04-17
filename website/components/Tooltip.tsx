import { autoUpdate, flip, offset, size, type Placement, type ReferenceElement } from "@floating-ui/dom";
import type { Side } from "@floating-ui/utils";
import clsx from "clsx";
import { createEffect, createMemo, createSignal, onMount, Show, type JSX } from "solid-js";
import { useFloating } from "../lib/floating-solid.js";

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
  arrowClass?: string;
  tip: JSX.Element;
  placement: Placement;
  offset?: number;
  arrow?: boolean;
  disabled?: boolean;
  withReference?: boolean;
  reference?: ReferenceElement;
}) {
  createEffect(() => {
    if (props.reference) {
      setReference(props.reference);
    }
  });

  const [reference, setReference] = createSignal<ReferenceElement | undefined>(props.reference);
  const [defaultReference, setDefaultReference] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  const [arrowEl, setArrow] = createSignal<HTMLElement>();

  const position = useFloating(reference, floating, {
    placement: props.placement,
    whileElementsMounted: autoUpdate,
    middleware: props.withReference
      ? [
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
        ]
      : [
          flip({
            fallbackAxisSideDirection: "end",
          }),
        ],
    offset: props.offset,
  });

  const positionArrow =
    props.arrow && props.withReference
      ? useFloating(defaultReference, arrowEl, {
          placement: props.placement.split("-")[0] as Side,
          whileElementsMounted: autoUpdate,
          middleware: [],
        })
      : undefined;

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
    positionArrow?.update();
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
        ref={(x) => {
          setDefaultReference(x);
          !props.reference && setReference(x);
        }}
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
          <div
            class="flex items-center justify-center"
            classList={{
              "w-1 relative hidden lg:block": props.withReference,
            }}
          >
            <div
              ref={setArrow}
              class={clsx("w-2 h-2 rotate-45", props.arrowClass, arrowOffset[placement()])}
              classList={{
                absolute: props.withReference,
              }}
              style={{
                top: positionArrow?.y ? `${positionArrow.y - 4}px` : undefined,
              }}
            ></div>
          </div>
        </Show>
        <div class={clsx("rounded-md flex-row items-center", props.tooltipClass)}>{props.tip}</div>
      </div>
    </div>
  );
}
