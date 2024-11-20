<template>
  <!-- BATI.has("tailwindcss") -->
  <div class="p-5 mb-2">
    <a href="/">
      <img src="../assets/logo.svg" height="64" width="64" />
    </a>
  </div>
  <!-- BATI.has("panda-css") -->
  <div :class="css({ p: '20px', mb: '10px' })">
    <a href="/">
      <img src="../assets/logo.svg" height="64" width="64" />
    </a>
  </div>
  <!-- !BATI.has("tailwindcss") && !BATI.has("panda-css") -->
  <div style="margin-top: 20px; margin-bottom: 10px">
    <a href="/">
      <img src="../assets/logo.svg" height="64" width="64" />
    </a>
  </div>
</template>
<script setup lang="ts">
import { css } from "../styled-system/css";
</script>
