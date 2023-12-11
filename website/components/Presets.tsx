import type { CategoryLabels, Flags } from "@batijs/features";
import { StoreContext } from "#components/Store.js";
import clsx from "clsx";
import { useContext } from "solid-js";

function Preset(props: { title: string; features: (Flags | CategoryLabels)[]; class?: string; disabled?: boolean }) {
  const { selectPreset } = useContext(StoreContext);

  return (
    <button
      type="button"
      disabled={props.disabled}
      class={clsx("btn btn-sm", props.class)}
      onclick={() => !props.disabled && selectPreset(props.features)}
      classList={{
        "cursor-not-allowed": props.disabled,
      }}
    >
      {props.title}
    </button>
  );
}

export default function Presets() {
  return (
    <div class="w-full flex box-border gap-2">
      <Preset title="Plain Vike" features={[]} />
      <Preset title="Frontend" features={["Framework", "CSS", "Linter"]} />
      <Preset title="Full-stack" features={["Framework", "RPC", "Auth", "Database", "CSS", "Server", "Linter"]} />
      <Preset title="Next.js" features={["react", "Auth", "RPC", "Server", "vercel", "Linter"]} />
      <Preset title="E-commerce" features={["Framework"]} disabled={true} />
    </div>
  );
}
