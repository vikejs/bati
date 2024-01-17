import React from "react";

// Default <head> (can be overridden by pages)

export default function HeadDefault() {
  if (BATI.has("plausible.io")) {
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* See https://plausible.io/docs/plausible-script */}
        {/* TODO: update data-domain */}
        <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
      </>
    );
  } else if (BATI.has("google-analytics")) {
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}');`,
          }}
        ></script>
      </>
    );
  } else {
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </>
    );
  }
}
