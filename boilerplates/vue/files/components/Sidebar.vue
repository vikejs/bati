<template>
  <!-- BATI.has("tailwindcss") -->
  <div id="sidebar" class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200">
    <slot />
  </div>
  <!-- !BATI.has("tailwindcss") -->
  <div
    id="sidebar"
    style="
      padding: 20px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      line-height: 1.8em;
      border-right: 2px solid #eee;
    "
  >
    <slot />
  </div>
</template>
