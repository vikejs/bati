import type { Category, CategoryLabels } from "@batijs/features";
import Messages from "#components/Messages";
import { StoreContext } from "#components/Store";
import { EnrichedTooltip } from "#components/Tooltip";
import { createMemo, createSignal, For, type JSX, Show, untrack, useContext } from "solid-js";

export function FormControl(props: {
  children: JSX.Element;
  label: string;
  categories: Category[];
  flipLabel?: string;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLFieldSetElement>["classList"];
  style?: string;
}) {
  const { currentFeatures, selectFeature, rules } = useContext(StoreContext);
  const [modalRef, setModalRef] = createSignal<HTMLDialogElement>();

  function toggleInert() {
    const ref = untrack(modalRef);
    if (!ref) return;

    if (ref.open) {
      ref.removeAttribute("inert");
    } else {
      ref.setAttribute("inert", "");
    }
  }

  function showModal() {
    const ref = untrack(modalRef);
    if (!ref) return;

    ref.showModal();
    toggleInert();
  }

  return (
    <>
      <div
        class="tabs tabs-lg tabs-lifted group rounded-md shadow content-stretch items-stretch outline-offset-2 relative"
        style={{
          // similar to rounded-md
          "--tab-radius": "0.375rem",
        }}
      >
        <input
          type="radio"
          class="tab tab-active text-xl font-semibold cursor-default"
          aria-label={props.label}
          checked
          tabIndex={-1}
        />
        <div class="tab-content bg-base-100 border-base-300 rounded-md px-5 h-[22rem]">
          <div class="">
            <For each={props.categories}>
              {(category) => {
                const fs = createMemo(() => currentFeatures.filter((f) => f.category === category.label));

                return (
                  <div class="flex flex-col items-baseline">
                    <div class="divider divider-start font-semibold">{category.label}</div>
                    <div class="flex flex-row flex-wrap gap-2">
                      <For each={fs()}>
                        {(feature) => (
                          <EnrichedTooltip
                            tip={
                              "Vike cannot be disabled. It is the foundation that allows all others tools to work cohesively"
                            }
                            placement="right"
                            arrow={true}
                            offset={8}
                            tooltipClass="text-center w-64 p-2 text-sm shadow-md bg-primary text-primary-content"
                            arrowClass="bg-primary"
                            disabled={feature.flag !== "vike"}
                          >
                            <button
                              type="button"
                              class="btn btn-sm rounded-md text-nowrap"
                              data-flag={feature.flag}
                              disabled={feature.disabled}
                              classList={{
                                "!btn-primary !btn-active": feature.selected,
                              }}
                              onClick={() => {
                                if (feature.readonly) {
                                  return;
                                }
                                if (feature.disabled) return;
                                selectFeature(category.label as CategoryLabels, feature.flag, !feature.selected);
                              }}
                            >
                              <Show when={feature.image}>
                                <img class="w-4 h-4" src={feature.image} />
                              </Show>
                              {feature.label}
                            </button>
                          </EnrichedTooltip>
                        )}
                      </For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
        <button
          onclick={showModal}
          class="btn btn-md btn-primary btn-outline absolute right-4 bottom-4 gap-0 px-3 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19h4m0 0v-4m0 4l-4-4M9 5H5m0 0v4m0-4l4 4m6-4h4m0 0v4m0-4l-4 4M9 19H5m0 0v-4m0 4l4-4"
            />
          </svg>
          <span class="overflow-hidden text-nowrap w-0 group-hover:w-24 transition-all">Detailed view</span>
        </button>
      </div>
      <dialog ref={setModalRef} class="modal" inert onClose={toggleInert}>
        <div class="modal-box w-11/12 max-w-5xl">
          <h3 class="font-bold text-xl">{props.label}</h3>
          <Show when={rules().size > 0}>
            <div class="flex flex-col gap-2 leading-6 rounded-md mt-4">
              <Messages error={rules().error} warning={rules().warning} info={rules().info} />
            </div>
          </Show>
          <div>{props.children}</div>
          <div class="modal-action">
            <form method="dialog">
              <button class="btn">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
