<!-- https://vike.dev/Head -->

<template>
  <link rel="icon" :href="logoUrl" />
  <!-- BATI.has("tailwindcss") -->
  <link rel="stylesheet" :href="tailwindCss" />

  <!-- BATI.has("plausible.io") -->
  <!-- See https://plausible.io/docs/plausible-script -->
  <!-- TODO: update data-domain -->
  <component :is="'script'" defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js" />
</template>

<script setup lang="ts">
import logoUrl from "../assets/logo.svg";
//# BATI.has("tailwindcss")
import * as tailwindCss from "@batijs/tailwindcss/layouts/tailwind.css";
</script>
