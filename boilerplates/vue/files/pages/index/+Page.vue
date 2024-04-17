<template>
  <!-- BATI.has("tailwindcss") -->
  <h1 class="font-bold text-3xl pb-4">My Vike app</h1>
  <!-- !BATI.has("tailwindcss") -->
  <h1>My Vike app</h1>
  This page is:
  <ul>
    <li>Rendered to HTML.</li>
    <li>Interactive. <Counter /></li>
  </ul>
</template>

<script lang="ts">
import Counter from "../../components/Counter.vue";

const components = { Counter };
export default { components };
</script>
