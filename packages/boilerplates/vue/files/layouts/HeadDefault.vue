{{{! /* We are using the SquirrellyJS template syntax */ _}}}

<!-- Default <head> (can be overridden by pages) -->

<template>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >
{{{ @if (it.import.meta.BATI_MODULES?.includes("analytics:plausible.io")) }}}
  <!-- See https://plausible.io/docs/plausible-script -->
  <!-- TODO: update data-domain -->
  <script
    defer
    data-domain="yourdomain.com"
    src="https://plausible.io/js/script.js"
  />
{{{ /if }}}
</template>
