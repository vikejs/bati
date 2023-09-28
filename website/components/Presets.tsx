import { StoreContext, type FeaturesAll, type FeaturesType } from "#components/Store.js";
import clsx from "clsx";
import { useContext } from "solid-js";

function Preset(props: {
  title: string;
  features: (FeaturesType | FeaturesAll)[];
  class?: string;
  disabled?: boolean;
}) {
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
      <Preset title="Frontend" features={["framework:solid", "uikit"]} />
      <Preset title="Full-stack" features={["framework:solid", "rpc", "auth", "db", "uikit", "server"]} />
      <Preset title="Next.js" features={["framework:react", "auth", "rpc", "server", "hosting:vercel"]} />
      <Preset title="E-commerce" features={["framework"]} disabled={true} />
    </div>
  );
}
