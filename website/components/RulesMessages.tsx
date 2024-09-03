import { RulesMessage } from "@batijs/features/rules";
import { createMemo, onCleanup, onMount, useContext, type ValidComponent } from "solid-js";
import { StoreContext } from "./Store.js";

export interface RuleMessage {
  type: "info" | "warning" | "error" | "invisible";
  value: ValidComponent;
}

function error(value: ValidComponent): RuleMessage {
  return {
    type: "error",
    value,
  };
}

function warning(value: ValidComponent): RuleMessage {
  return {
    type: "warning",
    value,
  };
}

function info(value: ValidComponent): RuleMessage {
  return {
    type: "info",
    value,
  };
}

function invisible(value: ValidComponent): RuleMessage {
  return {
    type: "invisible",
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
  [RulesMessage.ERROR_MANTINE_R_REACT]: error(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">React</span> is required when using <span class="font-bold">Mantine</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick React or unselect <span class="font-bold">Mantine</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.INFO_HATTIP]: info(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">HatTip</span> is an experimental project. Prefer{" "}
        <span class="font-bold">(Hono / Express.js / H3 / Fastify)</span> for production use
      </span>
    );
  }),
  [RulesMessage.ERROR_DRIZZLE_R_SERVER]: error(() => {
    return (
      <span class="inline-block">
        A <span class="font-bold">Server</span> is required when using <span class="font-bold">Drizzle</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick a server (Express.js / H3 / ...) or unselect <span class="font-bold">Drizzle</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_DATA_R_SERVER]: error(() => {
    const { selectedFeatures } = useContext(StoreContext);

    const selectedData = createMemo(() => selectedFeatures().filter((f) => f.category === "Data fetching")?.[0].label);

    return (
      <span class="inline-block">
        A <span class="font-bold">Server</span> is required when using <span class="font-bold">Data fetching</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick a server (Express.js / H3 / ...) or unselect <span class="font-bold">{selectedData()}</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_CLOUDFLARE_R_COMPAT_SERVER]: error(() => {
    const { selectedFeatures } = useContext(StoreContext);

    const selectedServer = createMemo(() => selectedFeatures().filter((f) => f.category === "Server")?.[0].label);

    return (
      <span class="inline-block">
        <span class="font-bold">Cloudflare</span> is not compatible with{" "}
        <span class="font-bold">{selectedServer()}</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick a <span class="font-bold">Hono</span> or <span class="font-bold">HatTip</span>, or unselect{" "}
            <span class="font-bold">{selectedServer()}</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_LUCIA_R_COMPAT_DATABASE]: error(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">Lucia</span> requires a <span class="font-bold">Database</span>, and is currently only
        compatible with <span class="font-bold">SQLite</span> or <span class="font-bold">Drizzle</span>
        <ul class="list-custom list-dot">
          <li>
            Either pick a <span class="font-bold">SQLite</span> or <span class="font-bold">Drizzle</span>, or unselect{" "}
            <span class="font-bold">Lucia</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_AWS_R_COMPAT_SERVER]: error(() => {
    const { selectedFeatures } = useContext(StoreContext);

    const selectedServer = createMemo(() => selectedFeatures().filter((f) => f.category === "Server")?.[0]?.label);

    return (
      <span class="inline-block">
        {selectedServer() && (
          <>
            <span class="font-bold">AWS</span> deployment is not compatible with{" "}
            <span class="font-bold">{selectedServer()}</span>.
          </>
        )}
        {!selectedServer() && (
          <>
            <span class="font-bold">AWS</span> deployment requires a compatible server.
          </>
        )}
        <ul class="list-custom list-dot">
          <li>
            Pick a server: <span class="font-bold">Hono</span> or <span class="font-bold">HatTip</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.ERROR_SHADCN_R_REACT]: error(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">React</span> is required with <span class="font-bold">shadcn/ui</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick a <span class="font-bold">React</span> or unselect <span class="font-bold">shadcn/ui</span>
          </li>
        </ul>
      </span>
    );
  }),
  [RulesMessage.WARN_SHADCN_R_TAILWINDCSS]: warning(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">shadcn/ui</span> integration is tied to <span class="font-bold">TailwindCSS</span>.
        Using another CSS library with it may have unpredictable behaviour.
      </span>
    );
  }),
  [RulesMessage.INFO_DRIZZLE_STACKBLITZ]: invisible(() => {
    onMount(() => {
      document
        .querySelector("#stackblitz-cta")!
        .setAttribute("data-tip", "The Drizzle example uses better-sqlite3, which is not supported by Stackblitz");
    });

    onCleanup(() => {
      document.querySelector("#stackblitz-cta")!.removeAttribute("data-tip");
    });

    return <></>;
  }),
} satisfies Record<RulesMessage, RuleMessage>;
