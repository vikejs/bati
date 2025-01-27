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
  <!-- BATI.has("panda-css") -->
  <button
    type="button"
    :class="
      css({
        display: 'inline-block',
        border: '1px solid black',
        rounded: 'sm',
        bg: 'gray.200',
        px: 1,
        py: 0.5,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '16px',
      })
    "
    @click="state.count++"
  >
    Counter {{ state.count }}
  </button>
  <!-- !BATI.has("tailwindcss") && !BATI.has("panda-css") -->
  <button type="button" @click="state.count++">Counter {{ state.count }}</button>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { css } from "../styled-system/css";

const state = reactive({ count: 0 });
</script>
