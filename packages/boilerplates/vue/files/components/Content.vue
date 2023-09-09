{{{! /* We are using the SquirrellyJS template syntax */ _}}}

<template>
  <div id="page-container">
    <div
      id="page-content"
{{{ @if (it.import.meta.BATI_MODULES?.includes("uikit:tailwindcss")) }}}
      class="p-5 pb-12 min-h-screen"
{{{ #else }}}
      style="
        padding: 20px;
        padding-bottom: 50px;
        min-height: 100vh;
      "
{{{ /if }}}
    >
      <slot />
    </div>
  </div>
</template>

<style>
/* Page Transition Animation */
body.page-is-transitioning #page-content {
  opacity: 0;
}
</style>

<style scoped>
/* Page Transition Animation */
#page-content {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}
</style>
