import { copy } from "#components/Copy.js";
import Description from "#components/Description.js";
import Features from "#components/Features.js";
import { flip } from "#components/Flip.js";
import Messages from "#components/Messages.js";
import Presets from "#components/Presets.js";
import Stackblitz from "#components/Stackblitz";
import { StoreContext } from "#components/Store.js";
import { createMemo, createSignal, Show, useContext } from "solid-js";

// avoid removing import when trying to optimize them
// https://github.com/solidjs/solid/discussions/845
copy;
flip;

export function Widget(props: { theme?: string; widget: boolean }) {
  const { selectedFeaturesFlags, rules } = useContext(StoreContext);
  const [tooltipText, setTooltipText] = createSignal("Copy to Clipboard");

  function getFlags() {
    return selectedFeaturesFlags().map((flag) => `--${flag}`);
  }

  const words = createMemo(() => ["pnpm", "create", "@batijs/app", ...getFlags()]);

  const handleMouseEnter = () => {
    setTooltipText("Copy to Clipboard");
  };

  const handleCopy = () => {
    setTooltipText("Copied to Clipboard!");
  };

  return (
    <div
      data-theme={props.theme}
      class="flex flex-col bg-base-300 p-6 rounded-xl shadow-2xl font-sans bati-widget"
      classList={{
        "w-4/5": !props.widget,
      }}
    >
      <div class="mb-2 w-full">
        <Description />
      </div>
      <div class="flex px-4 sm:join">
        <kbd
          class="cursor-pointer group join-item relative flex-1 justify-start pl-9 tooltip tooltip-primary text-left inline-flex tooltip-bottom kbd kbd-sm select-all flex-wrap rounded-md leading-9 gap-2.5"
          use:copy
          onMouseEnter={handleMouseEnter}
          onClick={handleCopy}
          data-tip={tooltipText()}
        >
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
          {words().join(" ")}
        </kbd>
        <Stackblitz flags={getFlags()} class="join-item hidden sm:flex" />
      </div>
      <Show when={rules().size > 0}>
        <div class="flex flex-col gap-2 leading-6 rounded-md mt-4">
          <Messages error={rules().error} warning={rules().warning} info={rules().info} />
        </div>
      </Show>

      <div class="divider my-2"></div>
      <div class="w-full flex flex-col relative">
        <div class="flex items-center py-2 px-3 overflow-auto md:overflow-visible bg-base-100 rounded-md">
          <span class="text-lg font-bold">Presets</span>
          <div class="divider divider-horizontal mx-1"></div>
          <Presets />
        </div>
        <Features />
      </div>
    </div>
  );
}
