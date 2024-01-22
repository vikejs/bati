<!-- Default <head> (can be overridden by pages) -->

<template>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Demo showcasing Vike" />
  <link rel="icon" :href="logoUrl" />

  <!-- BATI.has("plausible.io") -->
  <!-- See https://plausible.io/docs/plausible-script -->
  <!-- TODO: update data-domain -->
  <component :is="'script'" defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js" />
</template>

<script setup lang="ts">
import logoUrl from "../assets/logo.svg";
</script>
