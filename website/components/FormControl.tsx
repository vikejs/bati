import clsx from "clsx";
import { type JSX } from "solid-js";

export function FormControl(props: {
  children: JSX.Element;
  label: string;
  flipLabel?: string;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLFieldSetElement>["classList"];
  style?: string;
}) {
  return (
    <fieldset class={clsx("form-control", props.class)} style={props.style} classList={props.classList}>
      <legend class="label text-lg font-bold ml-1">{props.label}</legend>
      {props.children}
    </fieldset>
  );
}
