{{{! /* We are using the SquirrellyJS template syntax */ _}}}

<template>
  <div
{{{ @if (it.import.meta.BATI_MODULES?.includes("tailwindcss")) }}}
    class="p-5 mb-2"
{{{ #else }}}
    style="
      margin-top: 20px;
      margin-bottom: 10px;
    "
{{{ /if }}}
  >
    <a href="/">
      <img
        src="../assets/logo.svg"
        height="64"
        width="64"
      >
    </a>
  </div>
</template>
