import { Cli } from "#components/Cli";
import Description from "#components/Description.js";
import Features from "#components/Features.js";
import Messages from "#components/Messages.js";
import Presets from "#components/Presets.js";
import Stackblitz from "#components/Stackblitz";
import { StoreContext } from "#components/Store.js";
import { createMemo, createSignal, type JSX, Show, useContext } from "solid-js";
import { track } from "../lib/track";

export function CliGroup(
  props: {
    tooltipText: string;
    flags: string[];
  } & Pick<JSX.HTMLAttributes<unknown>, "onMouseEnter" | "onClick" | "children">,
) {
  return (
    <div role="tabpanel" class="tab-content w-full bg-base-100 border-base-300 rounded-md p-1.5">
      <div class="sm:join flex flex-row w-full rounded-md">
        <Cli onMouseEnter={props.onMouseEnter} onClick={props.onClick} tooltipText={props.tooltipText}>
          {props.children}
        </Cli>
        <Stackblitz flags={props.flags} class="join-item hidden sm:flex font-normal" />
      </div>
    </div>
  );
}

export function Widget(props: { theme?: string; widget: boolean }) {
  const { selectedFeaturesFlags, rules } = useContext(StoreContext);
  const [tooltipText, setTooltipText] = createSignal("Copy to Clipboard");

  function getFlags() {
    return selectedFeaturesFlags().map((flag) => `--${flag}`);
  }

  const pnpm = createMemo(() => ["pnpm", "create", "@batijs/app", ...getFlags()]);
  const yarn = createMemo(() => ["yarn", "dlx", "@batijs/cli", ...getFlags()]);
  const bun = createMemo(() => ["bun", "create", "@batijs/app", ...getFlags()]);
  const npm = createMemo(() => ["npm", "create", "@batijs/app", "--", ...getFlags()]);

  const handleMouseEnter = () => {
    setTooltipText("Copy to Clipboard");
  };

  const handleCopy = (packageManager: string) => {
    track("copy", {
      flags: selectedFeaturesFlags(),
      package_manager: packageManager,
    });
    setTooltipText("Copied to Clipboard!");
  };

  return (
    <div
      data-theme={props.theme}
      class="flex flex-col bg-base-300 p-6 rounded-xl shadow-2xl font-sans bati-widget"
      classList={{
        "w-11/12": !props.widget,
      }}
    >
      <div class="mb-2 w-full">
        <Description />
      </div>
      <div class="flex">
        <div role="tablist" class="tabs tabs-lifted tabs-sm flex-1">
          <input type="radio" name="package_manager" role="tab" class="tab" aria-label="pnpm" checked />

          <CliGroup
            onMouseEnter={handleMouseEnter}
            onClick={() => handleCopy("pnpm")}
            tooltipText={tooltipText()}
            flags={getFlags()}
          >
            {pnpm().join(" ")}
          </CliGroup>

          <input type="radio" name="package_manager" role="tab" class="tab" aria-label="yarn" />

          <CliGroup
            onMouseEnter={handleMouseEnter}
            onClick={() => handleCopy("yarn")}
            tooltipText={tooltipText()}
            flags={getFlags()}
          >
            {yarn().join(" ")}
          </CliGroup>

          <input type="radio" name="package_manager" role="tab" class="tab" aria-label="bun" />

          <CliGroup
            onMouseEnter={handleMouseEnter}
            onClick={() => handleCopy("bun")}
            tooltipText={tooltipText()}
            flags={getFlags()}
          >
            {bun().join(" ")}
          </CliGroup>

          <input type="radio" name="package_manager" role="tab" class="tab" aria-label="npm" />

          <CliGroup
            onMouseEnter={handleMouseEnter}
            onClick={() => handleCopy("npm")}
            tooltipText={tooltipText()}
            flags={getFlags()}
          >
            {npm().join(" ")}
          </CliGroup>
        </div>
      </div>
      <Show when={rules().size > 0}>
        <div class="flex flex-col gap-2 leading-6 rounded-md mt-4">
          <Messages error={rules().error} warning={rules().warning} info={rules().info} invisible={rules().invisible} />
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
