<template>
  <h1>Star Wars Movies</h1>
  <ol>
    <li
      v-for="item in movies"
      :key="item.id"
    >
      <a :href="'/star-wars/' + item.id">{{ item.title }}</a> ({{ item.release_date }})
    </li>
  </ol>
  <p>Source: <a href="https://star-wars.brillout.com">star-wars.brillout.com</a>.</p>
</template>

<script lang="ts" setup>
defineProps({
  movies: {
    type: Array,
    required: true,
  },
})
</script>
