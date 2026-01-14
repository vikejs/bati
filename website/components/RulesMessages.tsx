import { RulesMessage } from "@batijs/features/rules";
import { createEffect, createMemo, on, onCleanup, onMount, useContext, type ValidComponent } from "solid-js";
import { useRootContext } from "#components/RootContext";
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

// biome-ignore lint/correctness/noUnusedVariables: unused for now
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
        <a class="link" href="https://vike.dev/integration#server-side-tools" target="_blank" rel="noopener">
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
  [RulesMessage.ERROR_KYSELY_R_SERVER]: error(() => {
    return (
      <span class="inline-block">
        A <span class="font-bold">Server</span> is required when using <span class="font-bold">Kysely</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick a server (Express.js / H3 / ...) or unselect <span class="font-bold">Kysely</span>
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
            Either pick <span class="font-bold">Hono</span>, <span class="font-bold">H3</span>, or unselect{" "}
            <span class="font-bold">{selectedServer()}</span>
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
            Compatible servers: <span class="font-bold">Hono</span>
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
  [RulesMessage.ERROR_VIKE_REACT_QUERY_R_REACT]: error(() => {
    return (
      <span class="inline-block">
        <span class="font-bold">React</span> is required when using <span class="font-bold">React Query</span>.
        <ul class="list-custom list-dot">
          <li>
            Either pick <span class="font-bold">React</span> or unselect <span class="font-bold">React Query</span>
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
  [RulesMessage.INFO_STACKBLITZ_COMPAT]: invisible(() => {
    const root = useRootContext();
    const { selectedFeatures } = useContext(StoreContext);

    const unsupported = createMemo(() =>
      selectedFeatures().filter(
        (f) => f.flag === "drizzle" || f.flag === "sqlite" || f.flag === "kysely" || f.flag === "cloudflare",
      ),
    );

    function updateTooltip() {
      root?.()
        ?.querySelectorAll(".stackblitz-cta")
        .forEach((elt) => {
          elt.classList.add("tooltip");
          elt.setAttribute(
            "data-tip",
            "Stackblitz does not support the following features: " +
              unsupported()
                .map((f) => f.label)
                .join(", "),
          );
        });
    }

    createEffect(on(unsupported, updateTooltip));

    onMount(updateTooltip);

    onCleanup(() => {
      root?.()
        ?.querySelectorAll(".stackblitz-cta")
        .forEach((elt) => {
          elt.classList.remove("tooltip");
          elt.removeAttribute("data-tip");
        });
    });

    // biome-ignore lint/complexity/noUselessFragments: Valid TS
    return <></>;
  }),
} satisfies Record<RulesMessage, RuleMessage>;
