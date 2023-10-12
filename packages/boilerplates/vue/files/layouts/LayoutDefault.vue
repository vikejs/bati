
{{{! /* We are using the SquirrellyJS template syntax */ _}}}

<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/">
        Welcome
      </Link>
{{{ @if (it.import.meta.BATI_MODULES?.includes("telefunc")) }}}
      <Link href="/todo">
        Todo
      </Link>
{{{ /if }}}
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
{{{ @if (it.import.meta.BATI_MODULES?.includes("tailwindcss")) }}}
@import "./tailwind.css"; /* see https://stackoverflow.com/questions/55206901/how-to-import-css-files-in-vue-3-child-components */

{{{ /if }}}
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
