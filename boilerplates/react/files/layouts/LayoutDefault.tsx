import "./style.css";
//# BATI.has("tailwindcss")
import "./tailwind.css";
//# BATI.has("panda-css")
import "./panda.css";
import React from "react";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link.js";
import { css } from "../styled-system/css";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <div
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      className={BATI.has("tailwindcss") ? "flex max-w-5xl m-auto" : css({ display: "flex", maxW: "900px", m: "auto" })}
      //# BATI.has("compiled-css")
      css={{
        display: "flex",
        maxWidth: 1024,
        margin: "auto",
      }}
      //# !BATI.has("tailwindcss") && !BATI.has("compiled-css") && !BATI.has("panda-css")
      style={{
        display: "flex",
        maxWidth: 900,
        margin: "auto",
      }}
    >
      <Sidebar>
        <Logo />
        <Link href="/">Welcome</Link>
        <Link href="/todo">Todo</Link>
        <Link href="/star-wars">Data Fetching</Link>
        {BATI.has("firebase-auth") || BATI.has("lucia-auth") ? <Link href="/login">Login</Link> : ""}
      </Sidebar>
      <Content>{children}</Content>
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      className={
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
      //# BATI.has("compiled-css")
      css={{
        padding: 20,
        display: "flex",
        flexShrink: 0,
        flexDirection: "column",
        lineHeight: "1.8em",
        borderRight: "2px solid #eee",
      }}
      //# !BATI.has("tailwindcss") && !BATI.has("compiled-css") && !BATI.has("panda-css")
      style={{
        padding: 20,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        lineHeight: "1.8em",
        borderRight: "2px solid #eee",
      }}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div
        id="page-content"
        //# BATI.has("tailwindcss") || BATI.has("panda-css")
        className={BATI.has("tailwindcss") ? "p-5 pb-12 min-h-screen" : css({ p: "20px", pb: "50px", minH: "100vh" })}
        //# BATI.has("compiled-css")
        css={{
          padding: 20,
          paddingBottom: 48,
          minHeight: "100vh",
        }}
        //# !BATI.has("tailwindcss") && !BATI.has("compiled-css") && !BATI.has("panda-css")
        style={{
          padding: 20,
          paddingBottom: 50,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      //# BATI.has("tailwindcss") || BATI.has("panda-css")
      className={BATI.has("tailwindcss") ? "p-5 mb-2" : css({ p: "20px", mb: "10px" })}
      //# BATI.has("compiled-css")
      css={{
        padding: 20,
        marginBottom: 8,
      }}
      //# !BATI.has("tailwindcss") && !BATI.has("compiled-css") && !BATI.has("panda-css")
      style={{
        marginTop: 20,
        marginBottom: 10,
      }}
    >
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
