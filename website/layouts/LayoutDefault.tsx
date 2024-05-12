import "./tailwind.css";
import { StoreProvider } from "#components/Store";
import type { JSX } from "solid-js";

export default function LayoutDefault(props: { children?: JSX.Element }) {
  return (
    <StoreProvider>
      <div class="flex flex-col mx-auto">{props.children}</div>
    </StoreProvider>
  );
}
