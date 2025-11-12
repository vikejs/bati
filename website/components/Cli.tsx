/* eslint-disable @typescript-eslint/no-unused-expressions */

import type { JSX } from "solid-js";
import { copy } from "#components/Copy.js";
import { flip } from "#components/Flip.js";

// avoid removing import when trying to optimize them
// https://github.com/solidjs/solid/discussions/845
copy;
flip;

export function Cli(
  props: {
    tooltipText: string;
  } & Pick<JSX.HTMLAttributes<unknown>, "onMouseEnter" | "onClick" | "children">,
) {
  return (
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: ignored
    <kbd
      role="tabpanel"
      class="group min-h-10 join-item rounded-md cursor-pointer relative flex-1 justify-start pl-9 tooltip tooltip-primary text-left inline-flex tooltip-bottom kbd kbd-sm select-all flex-wrap leading-9 gap-2.5"
      use:copy
      onMouseEnter={props.onMouseEnter}
      onClick={props.onClick}
      data-tip={props.tooltipText}
    >
      {/** biome-ignore lint/a11y/noSvgWithoutTitle: ignored */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-terminal absolute top-2 left-2 opacity-40 h-5"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" x2="20" y1="19" y2="19" />
      </svg>
      <span class="text-xs/4">{props.children}</span>
    </kbd>
  );
}
