<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/">
        Welcome
      </Link>
      <!-- import.meta.BATI_MODULES?.includes("telefunc")) -->
      <Link href="/todo">
        Todo
      </Link>
      <Link href="/star-wars">
        Data Fetching
      </Link>
    </Sidebar>
    <Content><slot /></Content>
  </div>
</template>

<script lang="ts" setup>
import Sidebar from "../components/Sidebar.vue";
import Logo from "../components/Logo.vue";
import Link from "../components/Link.vue";
import Content from "../components/Content.vue";
</script>

<style>
/*# import.meta.BATI_MODULES?.includes("tailwindcss")) */
/* see https://stackoverflow.com/questions/55206901/how-to-import-css-files-in-vue-3-child-components */
@import "./tailwind.css";

body {
  margin: 0;
  font-family: sans-serif;
}
* {
  box-sizing: border-box;
}
a {
  text-decoration: none;
}
</style>

<style scoped>
.layout {
  display: flex;
  max-width: 900px;
  margin: auto;
}
.content {
  padding: 20px;
  padding-bottom: 50px;
  min-height: 100vh;
  flex-grow: 1;
}
.content {
  transition: opacity 0.1s ease-in;
}
.content.page-transition {
  opacity: 0;
}
</style>
