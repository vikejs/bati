// https://vike.dev/Head

//# BATI.has("mantine")
import { ColorSchemeScript } from "@mantine/core";
import logoUrl from "../assets/logo.svg";

export default function HeadDefault() {
  if (BATI.has("plausible.io")) {
    return (
      <>
        <link rel="icon" href={logoUrl} />
        {BATI.has("mantine") ? <ColorSchemeScript /> : null}
        {/* See https://plausible.io/docs/plausible-script */}
        {/* TODO: update data-domain */}
        <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
      </>
    );
  } else if (BATI.has("google-analytics")) {
    return (
      <>
        <link rel="icon" href={logoUrl} />
        {BATI.has("mantine") ? <ColorSchemeScript /> : null}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_ENV__GOOGLE_ANALYTICS}`}
        ></script>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM
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
    if (BATI.has("mantine")) {
      return (
        <>
          <link rel="icon" href={logoUrl} />
          {BATI.has("mantine") ? <ColorSchemeScript /> : null}
        </>
      );
    } else {
      return <link rel="icon" href={logoUrl} />;
    }
  }
}
