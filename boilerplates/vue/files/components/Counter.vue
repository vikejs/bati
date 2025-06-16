<template>
  <!-- BATI.has("daisyui") -->
  <button type="button" class="btn" @click="state.count++">Counter {{ state.count }}</button>
  <!-- BATI.has("tailwindcss") && !BATI.has("daisyui") -->
  <button
    type="button"
    class="inline-block border border-black rounded bg-gray-200 px-2 py-1 text-xs font-medium uppercase leading-normal"
    @click="state.count++"
  >
    Counter {{ state.count }}
  </button>
  <!-- !BATI.has("tailwindcss") -->
  <button type="button" @click="state.count++">Counter {{ state.count }}</button>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const state = reactive({ count: 0 });
</script>
