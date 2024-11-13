import { createSignal } from "solid-js";
import { css } from "../../styled-system/css";

export { Counter };

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button
      type="button"
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      class={
        BATI.has("tailwindcss")
          ? "inline-block border border-black rounded bg-gray-200 px-2 py-1 text-xs font-medium uppercase leading-normal"
          : css({
              display: "inline-block",
              border: "1px solid black",
              rounded: "sm",
              bg: "gray.200",
              px: 1,
              py: 0.5,
              fontSize: 12,
              fontWeight: 500,
              lineHeight: "16px",
            })
      }
      onClick={() => setCount((count) => count + 1)}
    >
      Counter {count()}
    </button>
  );
}
