{{{! /* We are using the SquirrellyJS template syntax */ _}}}

<template>
  <button
    type="button"
{{{ @if (it.import.meta.BATI_MODULES?.includes("uikit:tailwindcss")) }}}
      class="inline-block border border-black rounded bg-gray-200 px-2 py-1 text-xs font-medium uppercase leading-normal"
{{{ /if }}}
    @click="state.count++"
  >
    Counter {{ state.count }}
  </button>
</template>

<script lang="ts">
import { reactive } from 'vue'
export default {
  setup(props) {
    const state = reactive({ count: 0 })
    return {
      state
    }
  }
}
</script>
