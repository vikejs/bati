import { Cli } from "./Cli";
import Stackblitz from "./Stackblitz";
import { createMemo, createSignal, type JSX, useContext } from "solid-js";
import { StoreContext } from "#components/Store";
import { track } from "../lib/track";
import { isServer } from "solid-js/web";

export function CliGroup(
  props: {
    tooltipText: string;
    flags: string[];
  } & Pick<JSX.HTMLAttributes<unknown>, "onMouseEnter" | "onClick" | "children">,
) {
  return (
    <div role="tabpanel" class="tab-content !h-auto w-full bg-base-100 border-base-300 p-1.5">
      <div class="sm:join flex flex-row w-full rounded-md">
        <Cli onMouseEnter={props.onMouseEnter} onClick={props.onClick} tooltipText={props.tooltipText}>
          {props.children}
        </Cli>
        <Stackblitz flags={props.flags} class="join-item hidden sm:flex font-normal" />
      </div>
    </div>
  );
}

export default function InputGroup() {
  const { selectedFeaturesFlags } = useContext(StoreContext);
  const [tooltipText, setTooltipText] = createSignal("Copy to Clipboard");

  function getFlags() {
    return selectedFeaturesFlags().map((flag) => `--${flag}`);
  }

  const npm = createMemo(() => ["npm", "create", "vike@latest", "---", ...getFlags()]);
  const pnpm = createMemo(() => ["pnpm", "create", "vike@latest", ...getFlags()]);
  const yarn = createMemo(() => ["yarn", "create", "vike@latest", ...getFlags()]);
  const bun = createMemo(() => ["bun", "create", "vike@latest", ...getFlags()]);

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

  const persist = (packageManager: string) => {
    localStorage.setItem("packageManager", packageManager);
  };

  // Works as expected only for SPA or Web Component
  // For SSR, the <script> tag below ensures proper rendering on client side
  const initialInputValue = isServer ? "npm" : localStorage.getItem("packageManager") || "npm";

  return (
    <div role="tablist" class="tabs tabs-lift tabs-sm flex-1">
      <input
        type="radio"
        name="package_manager"
        role="tab"
        class="tab"
        aria-label="npm"
        onChange={() => persist("npm")}
        checked={initialInputValue === "npm"}
      />

      <CliGroup
        onMouseEnter={handleMouseEnter}
        onClick={() => handleCopy("npm")}
        tooltipText={tooltipText()}
        flags={getFlags()}
      >
        {npm().join(" ")}
      </CliGroup>

      <input
        type="radio"
        name="package_manager"
        role="tab"
        class="tab"
        aria-label="pnpm"
        onChange={() => persist("pnpm")}
        checked={initialInputValue === "pnpm"}
      />

      <CliGroup
        onMouseEnter={handleMouseEnter}
        onClick={() => handleCopy("pnpm")}
        tooltipText={tooltipText()}
        flags={getFlags()}
      >
        {pnpm().join(" ")}
      </CliGroup>

      <input
        type="radio"
        name="package_manager"
        role="tab"
        class="tab"
        aria-label="yarn"
        onChange={() => persist("yarn")}
        checked={initialInputValue === "yarn"}
      />

      <CliGroup
        onMouseEnter={handleMouseEnter}
        onClick={() => handleCopy("yarn")}
        tooltipText={tooltipText()}
        flags={getFlags()}
      >
        {yarn().join(" ")}
      </CliGroup>

      <input
        type="radio"
        name="package_manager"
        role="tab"
        class="tab"
        aria-label="bun"
        onChange={() => persist("bun")}
        checked={initialInputValue === "bun"}
      />

      <CliGroup
        onMouseEnter={handleMouseEnter}
        onClick={() => handleCopy("bun")}
        tooltipText={tooltipText()}
        flags={getFlags()}
      >
        {bun().join(" ")}
      </CliGroup>

      {/* Immediatly update DOM on client-side rendering */}
      <script>{`
      const p = localStorage.getItem("packageManager");
      if (p) {
        const select = 'input[name="package_manager"][aria-label="' + p + '"]';
        const el = document.querySelector(select);
        if (el) {
          el.checked = true;
        }
      }`}</script>
    </div>
  );
}
