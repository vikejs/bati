import { type TransformerProps } from "@batijs/core";

export default async function overrideLayout(props: TransformerProps) {
  return (
    `
import React from "react";
import logoUrl from "../assets/logo.svg";
import { ColorSchemeScript } from '@mantine/core';

// Default <head> (can be overridden by pages)

export default function HeadDefault() {` +
    (props.meta.BATI.has("plausible.io")
      ? `
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Demo showcasing Vike" />
        <link rel="icon" href={logoUrl} />
        <ColorSchemeScript />
        {/* See https://plausible.io/docs/plausible-script */}
        {/* TODO: update data-domain */}
        <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
      </>
    );`
      : "") +
    (props.meta.BATI.has("google-analytics")
      ? `
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Demo showcasing Vike" />
        <link rel="icon" href={logoUrl} />
        <ColorSchemeScript />
        <script
          async
          src={\`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}\`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: \`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}');\`,
          }}
        ></script>
      </>
    );`
      : "") +
    (!(props.meta.BATI.has("plausible.io") || props.meta.BATI.has("google-analytics"))
      ? `
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Demo showcasing Vike" />
        <link rel="icon" href={logoUrl} />
        <ColorSchemeScript />
      </>
    );
    `
      : "") +
    `
}
`
  );
}
