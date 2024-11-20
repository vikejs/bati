<template>
  <div id="page-container">
    <!-- BATI.has("tailwindcss") -->
    <div id="page-content" class="p-5 pb-12 min-h-screen">
      <slot />
    </div>
    <!-- BATI.has("panda-css") -->
    <div id="page-content" :class="css({ p: '20px', pb: '50px', minH: '100vh' })">
      <slot />
    </div>
    <!-- !BATI.has("tailwindcss") && !BATI.has("panda-css") -->
    <div id="page-content" style="padding: 20px; padding-bottom: 50px; min-height: 100vh">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { css } from "../styled-system/css";
</script>

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
