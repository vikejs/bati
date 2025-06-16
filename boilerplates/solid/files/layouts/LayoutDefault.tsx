import "./style.css";
//# BATI.has("tailwindcss")
import "./tailwind.css";
//# BATI.has("panda-css")
import "./panda.css";
import type { JSX } from "solid-js";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link.js";
import { css } from "../styled-system/css";

export default function LayoutDefault(props: { children?: JSX.Element }) {
  return (
    <div
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      class={BATI.has("tailwindcss") ? "flex max-w-5xl m-auto" : css({ display: "flex", maxW: "900px", m: "auto" })}
      //# !BATI.has("tailwindcss") && !BATI.has("panda-css")
      style={{
        display: "flex",
        "max-width": "900px",
        margin: "auto",
      }}
    >
      <Sidebar>
        <Logo />
        <Link href="/">Welcome</Link>
        <Link href="/todo">Todo</Link>
        <Link href="/star-wars">Data Fetching</Link>
        {BATI.has("firebase-auth") ? <Link href="/login">Login</Link> : ""}
      </Sidebar>
      <Content>{props.children}</Content>
    </div>
  );
}

function Sidebar(props: { children: JSX.Element }) {
  return (
    <div
      id="sidebar"
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      class={
        BATI.has("tailwindcss")
          ? "p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
          : css({
              p: "20px",
              display: "flex",
              flexShrink: 0,
              flexDir: "column",
              lineHeight: "1.8em",
              borderRight: "2px solid #eee",
            })
      }
      //# !BATI.has("tailwindcss") && !BATI.has("panda-css")
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
        //# BATI.has("tailwindcss") || BATI.has("panda-css")
        class={BATI.has("tailwindcss") ? "p-5 pb-12 min-h-screen" : css({ p: "20px", pb: "50px", minH: "100vh" })}
        //# !BATI.has("tailwindcss") && !BATI.has("panda-css")
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
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      class={BATI.has("tailwindcss") ? "p-5 mb-2" : css({ p: "20px", mb: "10px" })}
      //# !BATI.has("tailwindcss") && !BATI.has("panda-css")
      style={{
        "margin-top": "20px",
        "margin-bottom": "10px",
      }}
    >
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
