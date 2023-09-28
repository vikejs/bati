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
      el.classList.add("tooltip", "tooltip-open");

      clear = setTimeout(() => {
        el.classList.remove("tooltip", "tooltip-open");
      }, 3000);
    }
  }

  el.addEventListener("click", writeSelectionClipboard);

  onCleanup(() => el.removeEventListener("click", writeSelectionClipboard));
}
