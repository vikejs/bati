import { Counter } from "./Counter";

export default function Page() {
  return (
    <>
      <h1
        //# BATI.has("tailwindcss")
        class="font-bold text-3xl pb-4"
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
