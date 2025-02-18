import { Widget } from "#components/Widget";
import css from "#layouts/tailwind.css?inline";

import { StoreProvider } from "#components/Store";
import type { JSX } from "solid-js";

function LayoutWidget(props: { children?: JSX.Element }) {
  return (
    <StoreProvider>
      <style>{css}</style>
      {props.children}
    </StoreProvider>
  );
}

export default function AppWidget(props: { theme?: string }) {
  return (
    <LayoutWidget>
      <Widget widget={true} theme={props.theme} />
    </LayoutWidget>
  );
}
