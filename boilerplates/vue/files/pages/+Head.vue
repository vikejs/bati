<!-- https://vike.dev/Head -->

<template>
  <link rel="icon" :href="logoUrl" />

  <!-- BATI.has("plausible.io") -->
  <!-- See https://plausible.io/docs/plausible-script -->
  <!-- TODO: update data-domain -->
  <component :is="'script'" defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js" />
</template>

<script setup lang="ts">
import logoUrl from "../assets/logo.svg";
</script>
