import React, { useState } from "react";
import { css } from "../../styled-system/css";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      className={
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
      //# BATI.has("compiled-css")
      css={{
        display: "inline-block",
        border: "1px solid black",
        borderRadius: "0.25rem",
        backgroundColor: "#e5e7eb",
        padding: "4px 8px 4px 8px",
        fontSize: "0.75rem",
        fontWeight: "500",
        textTransform: "uppercase",
        lineHeight: "1.5",
      }}
      onClick={() => setCount((count) => count + 1)}
    >
      Counter {count}
    </button>
  );
}
