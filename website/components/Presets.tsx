import type { CategoryLabels, Flags } from "@batijs/features";
import { StoreContext } from "#components/Store.js";
import clsx from "clsx";
import { useContext } from "solid-js";

function Preset(props: { title: string; features: (Flags | CategoryLabels)[]; class?: string; disabled?: boolean; description?: string }) {
  const { selectPreset } = useContext(StoreContext);

  return (
    <div class='tooltip tooltip-bottom' data-tip={props.description}>
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
    </div>
  );
}

export default function Presets() {
  return (
    <div class="w-full flex box-border gap-2">
      <Preset title="Plain Vike" features={[]} description="Scaffold a simple app with Vike"/>
      <Preset title="Frontend" features={["solid", "CSS", "Linter"]} description="Scaffold a frontend app with Solid and Tailwind CSS"/>
      <Preset title="Full-stack" features={["solid", "RPC", "Auth", "Database", "CSS", "Server", "Linter"]} description="Scaffold a full-stack app with RPC (like server actions), Auth, Database and Server"/>
      <Preset title="Next.js" features={["react", "Auth", "RPC", "Server", "vercel", "Linter"]} description="Scaffold a Next.js like app with RPC (like server actions) and Vercel"/>
      <Preset title="E-commerce" features={["Framework"]} disabled={true} />
    </div>
  );
}
