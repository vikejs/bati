import { RulesMessage } from "@batijs/core/rules";
import { createMemo, useContext, type ValidComponent } from "solid-js";
import { StoreContext } from "./Store.js";

export interface RuleMessage {
  type: "info" | "warning" | "error";
  value: ValidComponent;
}

function error(value: ValidComponent): RuleMessage {
  return {
    type: "error",
    value,
  };
}

function info(value: ValidComponent): RuleMessage {
  return {
    type: "info",
    value,
  };
}

export const rulesMessages = {
  [RulesMessage.ERROR_AUTH_R_SERVER]: error(() => {
    const { inViewFeatures } = useContext(StoreContext);

    const selectedAuth = createMemo(() => inViewFeatures().auth?.features.find((f) => f.selected)?.label);

    return (
      <span class="inline-block">
        A <span class="font-bold">Server</span> is required when using <span class="font-bold">Auth</span>. Check{" "}
        <a class="link" href="https://vike.dev/integration#server-side-tools" target="_blank">
          Vike documentation.
        </a>
        <ul class="list-custom list-dot">
          <li>
            Either pick a server (Express.js / HatTip / ...) or unselect <span class="font-bold">{selectedAuth()}</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.INFO_HATTIP]: info(() => {
    return (
      <span class="inline-block">
        A <span class="font-bold">HatTip</span> is an experimental project. Prefer Express for production use
      </span>
    );
  }),
} satisfies Record<RulesMessage, RuleMessage>;
