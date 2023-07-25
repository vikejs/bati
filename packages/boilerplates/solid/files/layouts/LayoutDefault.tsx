import "./style.css";
//# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
import "./tailwind.css";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link";
import type { JSX } from "solid-js";

export default function LayoutDefault(props: { children?: JSX.Element }) {
  return (
    <div
      //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      class="flex max-w-5xl m-auto"
      //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      style={{
        display: "flex",
        "max-width": "900px",
        margin: "auto",
      }}
    >
      <Sidebar>
        <Logo />
        <Link href="/">Welcome</Link>
        {import.meta.BATI_MODULES?.includes("rpc:telefunc") ? <Link href="/todo">Todo</Link> : undefined}
        <Link href="/star-wars">Data Fetching</Link>
      </Sidebar>
      <Content>{props.children}</Content>
    </div>
  );
}

function Sidebar(props: { children: JSX.Element }) {
  return (
    <div
      id="sidebar"
      //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
      //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      style={{
        padding: "20px",
        "flex-shrink": 0,
        display: "flex",
        "flex-direction": "column",
        "line-height": "1.8em",
        "border-right": "2px solid #eee",
      }}
    >
      {props.children}
    </div>
  );
}

function Content(props: { children: JSX.Element }) {
  return (
    <div id="page-container">
      <div
        id="page-content"
        //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
        class="p-5 pb-12 min-h-screen"
        //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
        style={{
          padding: "20px",
          "padding-bottom": "50px",
          "min-height": "100vh",
        }}
      >
        {props.children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      class="p-5 mb-2"
      //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      style={{
        "margin-top": "20px",
        "margin-bottom": "10px",
      }}
    >
      <a href="/">
        <img src={logoUrl} height={64} width={64} />
      </a>
    </div>
  );
}
