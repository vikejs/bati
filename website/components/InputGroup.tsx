import { Cli } from "./Cli";
import Stackblitz from "./Stackblitz";
import { createMemo, createSignal, type JSX, useContext } from "solid-js";
import { StoreContext } from "#components/Store";
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

export default function InputGroup() {
  const { selectedFeaturesFlags } = useContext(StoreContext);
  const [tooltipText, setTooltipText] = createSignal("Copy to Clipboard");

  function getFlags() {
    return selectedFeaturesFlags().map((flag) => `--${flag}`);
  }

  const npm = createMemo(() => ["npm", "create", "bati", "---", ...getFlags()]);
  const pnpm = createMemo(() => ["pnpm", "create", "bati", ...getFlags()]);
  const yarn = createMemo(() => ["yarn", "dlx", "@batijs/cli", ...getFlags()]);
  const bun = createMemo(() => ["bun", "create", "bati", ...getFlags()]);

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

  return (
    <div role="tablist" class="tabs tabs-lifted tabs-sm flex-1">
      <input
        type="radio"
        name="package_manager"
        role="tab"
        class="tab"
        aria-label="npm"
        onChange={() => persist("npm")}
        checked
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
