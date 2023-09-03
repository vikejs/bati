import React from "react";

// Default <head> (can be overridden by pages)

export default function HeadDefault() {
  if (import.meta.BATI_MODULES?.includes("analytics:plausible.io")) {
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* See https://plausible.io/docs/plausible-script */}
        {/* TODO: update data-domain */}
        <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
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
