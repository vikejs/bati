<template>
  <h1>{{ heading }}</h1>
  <p>{{ abortReason }}</p>
</template>

<script lang="ts" setup>
import { usePageContext } from "vike-vue/usePageContext";

const pageContext = usePageContext();
let { is404, abortReason } = pageContext;
if (!abortReason) {
  abortReason = is404 ? "This page could not be found." : "Something went wrong.";
}
const heading = is404 ? "Page Not Found" : "Internal Error";
</script>
