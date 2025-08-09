import clsx from "clsx";
import { createMemo, useContext } from "solid-js";
import { StoreContext } from "#components/Store.js";
import type { Feature } from "../types.js";

const lf = new Intl.ListFormat("en");

function FeatureWord(props: { feature: Pick<Feature, "label" | "url"> }) {
  if (props.feature.url) {
    return (
      <a href={props.feature.url} target="_blank">
        <span class={clsx("text-primary link link-hover", props.feature.label === "Vike" && "font-semibold")}>
          {props.feature.label}
        </span>
      </a>
    );
  }
  return (
    <span class={clsx("text-primary", props.feature.label === "Vike" && "font-semibold")}>{props.feature.label}</span>
  );
}

export default function Description() {
  const { selectedFeatures } = useContext(StoreContext);

  const formattedLabels = createMemo(() =>
    lf
      .formatToParts(selectedFeatures().map((x) => x.label))
      .map((p) =>
        p.type === "literal" ? p.value : <FeatureWord feature={selectedFeatures().find((x) => x.label === p.value)!} />,
      ),
  );

  return <span class="text-lg">Scaffolds a web app using {formattedLabels()}.</span>;
}
