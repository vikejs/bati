import { StoreProvider } from "#components/Store";
import { Widget } from "#components/Widget";
import css from "#layouts/web-component.css?inline";
import type { JSX } from "solid-js";

function LayoutDefault(props: { children?: JSX.Element }) {
  return (
    <StoreProvider>
      <style>{css}</style>
      {props.children}
    </StoreProvider>
  );
}

export default function AppWidget(props: { theme?: string }) {
  return (
    <LayoutDefault>
      <Widget widget={true} theme={props.theme} />
    </LayoutDefault>
  );
}
