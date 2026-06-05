<template>
  <h1>Account</h1>
  <p>
    Signed in as <strong>{{ pageContext.user?.email }}</strong>
  </p>
  <p v-if="pageContext.user?.name">Name: {{ pageContext.user.name }}</p>
  <button :class="buttonClass" type="button" @click="onSignOut">Sign out</button>
</template>

<script lang="ts" setup>
import { createAuthClient } from "better-auth/vue";
import { usePageContext } from "vike-vue/usePageContext";

const authClient = createAuthClient();
const pageContext = usePageContext();

const buttonClass = BATI.has("tailwindcss")
  ? "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
  : "";

const onSignOut = async () => {
  await authClient.signOut();
  window.location.href = "/";
};
</script>
