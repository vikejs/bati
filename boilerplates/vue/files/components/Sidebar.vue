<template>
  <!-- BATI.has("tailwindcss") -->
  <div id="sidebar" class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200">
    <slot />
  </div>
  <!-- BATI.has("panda-css") -->
  <div
    id="sidebar"
    :class="
      css({
        p: '20px',
        display: 'flex',
        flexShrink: 0,
        flexDir: 'column',
        lineHeight: '1.8em',
        borderRight: '2px solid #eee',
      })
    "
  >
    <slot />
  </div>
  <!-- !BATI.has("tailwindcss") && !BATI.has("panda-css") -->
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
<script setup lang="ts">
import { css } from "../styled-system/css";
</script>
