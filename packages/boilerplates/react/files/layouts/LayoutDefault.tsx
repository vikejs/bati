import "./style.css";
//# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
import "./tailwind.css";
import React from "react";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <div
      //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      className="flex max-w-5xl m-auto"
      //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      style={{
        display: "flex",
        maxWidth: 900,
        margin: "auto",
      }}
    >
      <Sidebar>
        <Logo />
        <Link href="/">Welcome</Link>
        {import.meta.BATI_MODULES?.includes("rpc:telefunc") ? <Link href="/todo">Todo</Link> : undefined}
        <Link href="/star-wars">Data Fetching</Link>
      </Sidebar>
      <Content>{children}</Content>
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      className="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
      //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
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
        //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
        className="p-5 pb-12 min-h-screen"
        //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
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
      //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
      className="p-5 mb-2"
      //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
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
