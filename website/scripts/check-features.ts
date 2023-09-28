import { features } from "@batijs/core";
import featuresWeb from "../assets/features.json" assert { type: "json" };
import type { Feature } from "../types";

const nss = new Set(Object.keys(featuresWeb));

interface State {
  missingNss: Set<string>;
  missingFeatures: {
    ns: string;
    value: string;
    disabled: boolean;
  }[];
}

function checkFeatures(): State {
  const state: State = {
    missingNss: new Set(),
    missingFeatures: [],
  };

  for (const feature of features) {
    const [ns, v] = feature.split(":");

    if (!nss.has(ns)) {
      state.missingNss.add(ns);
    }

    const foundFeature: Feature | undefined = featuresWeb[
      ns as keyof typeof featuresWeb
    ].features.find((f) => f.value === v);
    if (!foundFeature || (foundFeature && foundFeature.disabled)) {
      state.missingFeatures.push({
        ns,
        value: v,
        disabled: Boolean(foundFeature?.disabled),
      });
    }
  }

  return state;
}

function main() {
  const state = checkFeatures();
  let text = "";

  if (state.missingNss.size > 0) {
    text += "New namespaces:";
    text += "\n- " + Array.from(state.missingNss).join("\n- ");
    text += "\n\n";
  }

  if (state.missingFeatures.length > 0) {
    text += "New features:";
    text +=
      "\n- " +
      state.missingFeatures
        .map(
          ({ ns, value, disabled }) =>
            `${ns}:${value}${disabled ? " (disabled)" : ""}`,
        )
        .join("\n- ");
    text += "\n\n";
  }

  const missing = state.missingNss.size + state.missingFeatures.length;

  if (missing) {
    console.error(text);
    process.exit(1);
  }
}

main();
