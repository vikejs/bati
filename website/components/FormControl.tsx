import clsx from "clsx";
import { type JSX } from "solid-js";
import { flip } from "./Flip.js";

// avoid removing import when trying to optimize them
// https://github.com/solidjs/solid/discussions/845
const _flip = flip;

export function FormControl(props: {
  children: JSX.Element;
  label: string;
  flipLabel?: string;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLFieldSetElement>["classList"];
  style?: string;
}) {
  return (
    <fieldset
      class={clsx("form-control", props.class)}
      style={props.style}
      classList={props.classList}
      use:flip={props.flipLabel}
    >
      <legend class="label text-lg font-bold ml-1">{props.label}</legend>
      {props.children}
    </fieldset>
  );
}
