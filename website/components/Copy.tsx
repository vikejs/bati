import { createSignal, onCleanup } from "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      copy: boolean;
    }
  }
}

export function copy(el: HTMLElement) {
  let clear: ReturnType<typeof setTimeout>;
  const [clicked, setClicked] = createSignal(false);

  async function writeSelectionClipboard() {
    clearTimeout(clear);
    setClicked(true);
    const selObj = window.getSelection();
    if (selObj) {
      const toCopy = selObj.toString().replaceAll("\n", " ");
      await navigator.clipboard.writeText(toCopy);
      el.classList.remove("tooltip-primary");
      el.classList.add("tooltip", "tooltip-open", "tooltip-success");

      clear = setTimeout(() => {
        el.classList.remove("tooltip", "tooltip-open", "tooltip-success");
        setClicked(false);
      }, 3000);
    }
  }

  function handleMouseHover() {
    el.classList.remove("tooltip-success");
    el.classList.add("tooltip", "tooltip-open", "tooltip-primary");
    setClicked(false);
  }

  function handleMouseLeave() {
    if (!clicked()) {
      el.classList.remove("tooltip", "tooltip-open", "tooltip-primary");
    }
  }

  el.addEventListener("click", writeSelectionClipboard);
  el.addEventListener("mouseenter", handleMouseHover);
  el.addEventListener("mouseleave", handleMouseLeave);

  onCleanup(() => el.removeEventListener("click", writeSelectionClipboard));
}
