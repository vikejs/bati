/** @jsxImportSource solid-js */

import { createMemo } from "solid-js";
import { usePageContext } from "solide/usePageContext";

export function Link(props: { href: string; children: string }) {
  const pageContext = usePageContext();
  const isActive = createMemo(() =>
    props.href === "/" ? pageContext.urlPathname === props.href : pageContext.urlPathname.startsWith(props.href)
  );
  return (
    <a href={props.href} class={isActive() ? "is-active" : undefined}>
      {props.children}
    </a>
  );
}
