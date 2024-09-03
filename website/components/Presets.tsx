import type { CategoryLabels, Flags } from "@batijs/features";
import { StoreContext } from "#components/Store.js";
import clsx from "clsx";
import { useContext } from "solid-js";
import { EnrichedTooltip } from "./Tooltip.js";

function Preset(props: {
  title: string;
  features: (Flags | CategoryLabels)[];
  class?: string;
  disabled?: boolean;
  description: string;
}) {
  const { selectPreset } = useContext(StoreContext);

  return (
    <EnrichedTooltip
      tip={props.description}
      placement="bottom"
      arrow={true}
      offset={12}
      tooltipClass="text-center w-64 p-2 text-sm shadow-md bg-base-200 text-neutral dark:bg-neutral dark:text-neutral-content"
      arrowClass="bg-base-200 dark:bg-neutral"
      disabled={props.disabled}
    >
      <button
        type="button"
        disabled={props.disabled}
        class={clsx("btn btn-sm whitespace-nowrap", props.class)}
        onclick={() => !props.disabled && selectPreset(props.features)}
        classList={{
          "cursor-not-allowed": props.disabled,
        }}
      >
        {props.title}
      </button>
    </EnrichedTooltip>
  );
}

export default function Presets() {
  return (
    <div class="w-full flex box-border gap-2">
      <Preset title="Plain Vike" features={[]} description="Simple app with Plain Vike" />
      <Preset
        title="Frontend"
        features={["UI Framework", "CSS", "Linter"]}
        description="Frontend app with a Framework and Tailwind CSS"
      />
      <Preset
        title="Full-stack"
        features={[
          "UI Framework",
          "Data fetching",
          "Auth",
          "Database",
          "CSS",
          "UI Component Libraries",
          "Server",
          "Linter",
        ]}
        description="Full-stack app with RPC (like server actions), Auth, Database and Server"
      />
      <Preset
        title="Next.js"
        features={["react", "Auth", "Data fetching", "Server", "vercel", "Linter"]}
        description="Next.js like app with RPC (like server actions) and Vercel"
      />
      <Preset title="E-commerce" features={["UI Framework"]} disabled={true} description="" />
    </div>
  );
}
