import { StoreContext } from "#components/Store.js";
import clsx from "clsx";
import { createMemo, useContext } from "solid-js";

const lf = new Intl.ListFormat("en");

export default function Description() {
  const { featuresLabels } = useContext(StoreContext);

  const formattedLabels = createMemo(() =>
    lf
      .formatToParts(["Vike", ...featuresLabels()])
      .map((p) =>
        p.type === "literal" ? (
          p.value
        ) : (
          <span class={clsx("text-primary", p.value === "Vike" && "font-semibold")}>{p.value}</span>
        ),
      ),
  );

  return <span class="text-lg">Scaffolds a web app using {formattedLabels()}.</span>;
}
