import type { CategoryLabels, Flags } from "@batijs/features";
import { StoreContext } from "#components/Store.js";
import clsx from "clsx";
import { useContext } from "solid-js";
import { Tooltip } from "./Tooltip";

function Preset(props: { title: string; features: (Flags | CategoryLabels)[]; class?: string; disabled?: boolean; description: string }) {
  const { selectPreset } = useContext(StoreContext);

  return (
    <Tooltip tip={props.description}>
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
    </Tooltip>
  );
}

export default function Presets() {
  return (
    <div class="w-full flex box-border gap-2">
      <Preset title="Plain Vike" features={[]} description="Simple app with Plain Vike" />
      <Preset title="Frontend" features={["Framework", "CSS", "Linter"]} description="Frontend app with Solid and Tailwind CSS" />
      <Preset title="Full-stack" features={["Framework", "RPC", "Auth", "Database", "CSS", "Server", "Linter"]} description="Full-stack app with RPC (like server actions), Auth, Database and Server" />
      <Preset title="Next.js" features={["react", "Auth", "RPC", "Server", "vercel", "Linter"]} description="Next.js like app with RPC (like server actions) and Vercel" />
      <Preset title="E-commerce" features={["Framework"]} disabled={true} description="" />
    </div>
  );
}
