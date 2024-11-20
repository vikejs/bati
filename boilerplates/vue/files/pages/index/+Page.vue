<template>
  <!-- BATI.has("tailwindcss") -->
  <h1 class="font-bold text-3xl pb-4">My Vike app</h1>
  <!-- BATI.has("panda-css") -->
  <h1 :class="css({ font: 'bold 2em sans-serif', marginBlock: '0.67em' })">My Vike app</h1>
  <!-- !BATI.has("tailwindcss") && !BATI.has("panda-css") -->
  <h1>My Vike app</h1>
  This page is:
  <ul>
    <li>Rendered to HTML.</li>
    <li>Interactive. <Counter /></li>
  </ul>
</template>

<script setup lang="ts">
import Counter from "../../components/Counter.vue";
import { css } from "../../styled-system/css";
</script>
