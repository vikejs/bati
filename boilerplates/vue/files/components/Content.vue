<template>
  <div id="page-container">
    <!-- BATI.has("tailwindcss") -->
    <div id="page-content" class="p-5 pb-12 min-h-screen">
      <slot />
    </div>
    <!-- !BATI.has("tailwindcss") -->
    <div id="page-content" style="padding: 20px; padding-bottom: 50px; min-height: 100vh">
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
