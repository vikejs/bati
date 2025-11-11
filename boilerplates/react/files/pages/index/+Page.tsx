import { Counter } from "./Counter.js";

export default function Page() {
  return (
    <>
      <h1
        //# BATI.has("compiled-css")
        css={{ fontWeight: "700", fontSize: "1.875rem", paddingBottom: "1rem" }}
      >
        My Vike app
      </h1>
      <p>This page is:</p>
      <ul>
        <li>Rendered to HTML.</li>
        <li>
          Interactive. <Counter />
        </li>
      </ul>
    </>
  );
}
