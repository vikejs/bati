/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @see {@link https://developer.chrome.com/docs/web-platform/view-transitions}
 */

import type { Accessor } from "solid-js";

declare module "solid-js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      flip: string;
    }
  }
}

export function flip(el: HTMLElement, accessor: Accessor<string | undefined>) {
  const name = accessor();
  if (!name) return;
  el.setAttribute("data-flip-name", name);
  (el.style as any).viewTransitionName = name;
}

export function startViewTransition(name: string, callback: () => void) {
  const ref: HTMLElement | null = document.querySelector(`[data-flip-name="${name}"]`);

  if (!ref || !("startViewTransition" in document)) {
    callback();
    return;
  }

  (ref.style as any).viewTransitionName = name;

  (document.startViewTransition as Function)(() => {
    (ref.style as any).viewTransitionName = "";

    callback();
  });
}
