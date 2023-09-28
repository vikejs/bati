import "./tailwind.css";
import type { JSX } from "solid-js";
import { StoreProvider } from "#components/Store";

export default function LayoutDefault(props: { children?: JSX.Element }) {
  return (
    <StoreProvider>
      <div class="flex flex-col mx-auto">{props.children}</div>
    </StoreProvider>
  );
}
