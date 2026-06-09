<template>
  <template v-if="!pageContext.user">
    <a href="/login">Login</a>
    <a href="/signup">Sign up</a>
  </template>
  <template v-else>
    <span>{{ pageContext.user.email }}</span>
    <a href="/" @click.prevent="onSignOut">Sign out</a>
  </template>
</template>

<script lang="ts" setup>
import { createAuthClient } from "better-auth/vue";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";

const authClient = createAuthClient();
const pageContext = usePageContext();

const onSignOut = async () => {
  await authClient.signOut();
  await navigate("/");
};
</script>
