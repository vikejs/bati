<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/"> Welcome </Link>
      <Link href="/todo"> Todo </Link>
      <Link href="/star-wars"> Data Fetching </Link>
      <!-- BATI.has("firebase-auth") || BATI.has("lucia-auth") -->
      <Link href="/login">Login</Link>
    </Sidebar>
    <Content><slot /></Content>
  </div>
</template>

<script lang="ts" setup>
import Content from "../components/Content.vue";
import Link from "../components/Link.vue";
import Logo from "../components/Logo.vue";
import Sidebar from "../components/Sidebar.vue";
/*{ @if (it.BATI.has("sentry")) }*/
import { sentryBrowserConfig } from "../sentry.browser.config";
sentryBrowserConfig();
/*{ /if }*/
</script>

<style>
/*{ @if (it.BATI.has("tailwindcss")) }*/
/* see https://stackoverflow.com/questions/55206901/how-to-import-css-files-in-vue-3-child-components */
@import "./tailwind.css";
/*{ /if }*/

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
/* Page Transition Animation */
#page-content {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}
body.page-is-transitioning #page-content {
  opacity: 0;
}
</style>
