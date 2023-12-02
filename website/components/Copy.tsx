import { onCleanup } from "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      copy: boolean;
    }
  }
}

export function copy(el: HTMLElement) {
  let clear: ReturnType<typeof setTimeout>;

  async function writeSelectionClipboard() {
    clearTimeout(clear);
    const selObj = window.getSelection();
    if (selObj) {
      const toCopy = selObj.toString().replaceAll("\n", " ");
      await navigator.clipboard.writeText(toCopy);
      el.classList.remove("tooltip-primary");
      el.classList.add("tooltip", "tooltip-open", "tooltip-success");

      clear = setTimeout(() => {
        el.classList.remove("tooltip", "tooltip-open", "tooltip-success");
      }, 3000);
    }
  }

  async function handleHover() {
    el.classList.remove("tooltip-success");
    el.classList.add("tooltip", "tooltip-open", "tooltip-primary");
  }

  el.addEventListener("click", writeSelectionClipboard);
  el.addEventListener("mouseenter", handleHover);

  onCleanup(() => el.removeEventListener("click", writeSelectionClipboard));
}
