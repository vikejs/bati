import Description from "#components/Description.js";
import Features from "#components/Features.js";
import Messages from "#components/Messages.js";
import Presets from "#components/Presets.js";
import { StoreContext } from "#components/Store.js";
import { Show, useContext } from "solid-js";
import InputGroup from "#components/InputGroup";

export function Widget(props: { theme?: string; widget: boolean }) {
  const { rules } = useContext(StoreContext);

  return (
    <div
      data-theme={props.theme}
      class="flex flex-col bg-base-300 p-6 rounded-xl shadow-2xl font-sans bati-widget"
      classList={{
        "w-11/12": !props.widget,
      }}
    >
      <div class="mb-2 w-full">
        <Description />
      </div>
      <div class="flex">
        <InputGroup />
      </div>
      <Show when={rules().size > 0}>
        <div
          classList={{
            "flex flex-col gap-2 leading-6 rounded-md mt-4": rules().invisible.length < rules().size,
          }}
        >
          <Messages error={rules().error} warning={rules().warning} info={rules().info} invisible={rules().invisible} />
        </div>
      </Show>

      <div class="divider my-2"></div>
      <div class="w-full flex flex-col relative">
        <div class="flex items-center py-2 px-3 overflow-auto md:overflow-visible bg-base-100 rounded-md">
          <span class="text-lg font-bold">Presets</span>
          <div class="divider divider-horizontal mx-1"></div>
          <Presets />
        </div>
        <Features />
      </div>
    </div>
  );
}
