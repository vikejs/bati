import React from "react";
import { Counter } from "./Counter";

export default function Page() {
  return (
    <>
      <h1
        //# BATI.has("tailwindcss")
        className="font-bold text-3xl pb-4"
        //# BATI.has("compiled-css")
        css={{ fontWeight: "bold", fontSize: "1.875rem", paddingBottom: "1rem" }}
      >
        My Vike app
      </h1>
      This page is:
      <ul>
        <li>Rendered to HTML.</li>
        <li>
          Interactive. <Counter />
        </li>
      </ul>
    </>
  );
}
