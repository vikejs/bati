import { For, Show, type ComponentProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";

function Alert(props: { children?: ValidComponent[]; info?: boolean; warning?: boolean; error?: boolean }) {
  return (
    <div
      class="w-full rounded-md border-l-2"
      classList={{
        "border-info": props.info,
        "border-warning": props.warning,
        "border-error": props.error,
      }}
    >
      <ul
        class="flex flex-col gap-2 tracking-wide list-custom p-2 rounded-md"
        classList={{
          "bg-info/25 list-info": props.info,
          "bg-warning/25 list-warning": props.warning,
          "bg-error/25 list-error": props.error,
        }}
      >
        <For each={props.children}>
          {(el) => (
            <li>
              <Dynamic component={el} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

export type MessagesProps<T extends ValidComponent, P = ComponentProps<T>> = {
  [K in keyof P]: P[K];
} & {
  info?: T[];
  warning?: T[];
  error?: T[];
};

export default function Messages<T extends ValidComponent>(props: MessagesProps<T>) {
  return (
    <>
      <Show when={props.info?.length}>
        <Alert info>{props.info}</Alert>
      </Show>
      <Show when={props.warning?.length}>
        <Alert warning>{props.warning}</Alert>
      </Show>
      <Show when={props.error?.length}>
        <Alert error>{props.error}</Alert>
      </Show>
    </>
  );
}
