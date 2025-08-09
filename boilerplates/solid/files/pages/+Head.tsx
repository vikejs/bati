/* eslint-disable solid/no-innerhtml */

// https://vike.dev/Head

import logoUrl from "../assets/logo.svg";

export default function HeadDefault() {
  if (BATI.has("plausible.io")) {
    return (
      <>
        <link rel="icon" href={logoUrl} />
        {/* See https://plausible.io/docs/plausible-script */}
        {/* TODO: update data-domain */}
        <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js" />
      </>
    );
  } else if (BATI.has("google-analytics")) {
    return (
      <>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}`}
        />
        <script
          innerHTML={`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}');`}
        />
      </>
    );
  } else {
    return <link rel="icon" href={logoUrl} />;
  }
}
