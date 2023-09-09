{{{! /* We are using the SquirrellyJS template syntax */ _}}}

<template>
  <div
    id="sidebar"
{{{ @if (it.import.meta.BATI_MODULES?.includes("uikit:tailwindcss")) }}}
    class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
{{{ #else }}}
    style="
      padding: 20px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      line-height: 1.8em;
      border-right: 2px solid #eee;
    "
{{{ /if }}}
  >
    <slot />
  </div>
</template>
