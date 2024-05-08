import { RulesMessage } from "@batijs/features/rules";
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
    const { selectedFeatures } = useContext(StoreContext);

    const selectedAuth = createMemo(() => selectedFeatures().filter((f) => f.category === "Auth")?.[0].label);

    return (
      <span class="inline-block">
        A <span class="font-bold">Server</span> is required when using <span class="font-bold">Auth</span>. Check{" "}
        <a class="link" href="https://vike.dev/integration#server-side-tools" target="_blank">
          Vike documentation.
        </a>
        <ul class="list-custom list-dot">
          <li>
            Either pick a server (Express.js / H3 / ...) or unselect <span class="font-bold">{selectedAuth()}</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_COMPILED_R_REACT]: error(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">React</span> is required when using <span class="font-bold">Compiled</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick React or unselect <span class="font-bold">Compiled</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_AUTH0_E_HONO]: error(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">Auth0</span> does not support running on <span class="font-bold">Hono</span> with
        official plugins
        <ul class="list-custom list-dot">
          <li>
            Either pick another <span class="font-bold">Server</span>, or use <span class="font-bold">Auth.js</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.INFO_HATTIP]: info(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">HatTip</span> is an experimental project. Prefer <span class="font-bold">H3</span> or{" "}
        <span class="font-bold">Express</span> for production use
      </span>
    );
  }),
} satisfies Record<RulesMessage, RuleMessage>;
