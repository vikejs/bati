<template>
  <h1>Sign in</h1>
  <form @submit.prevent="onSubmit">
    <p>
      <input
        v-model="email"
        :class="inputClass"
        type="email"
        aria-label="Email"
        placeholder="Email"
        required
      />
    </p>
    <p>
      <input
        v-model="password"
        :class="inputClass"
        type="password"
        aria-label="Password"
        placeholder="Password"
        required
      />
    </p>
    <button :class="buttonClass" type="submit">Sign in</button>
  </form>
  <p>or</p>
  <button :class="githubButtonClass" type="button" @click="onGithub">Sign in with GitHub</button>
  <p v-if="error" role="alert">{{ error }}</p>
  <p>No account? <a href="/signup">Sign up</a></p>
</template>

<script lang="ts" setup>
import { createAuthClient } from "better-auth/vue";
import { ref } from "vue";

const authClient = createAuthClient();
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);

const inputClass = BATI.has("tailwindcss")
  ? "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
  : "";
const buttonClass = BATI.has("tailwindcss")
  ? "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
  : "";
const githubButtonClass = BATI.has("tailwindcss")
  ? "text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:outline-hidden focus:ring-gray-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
  : "";

const onSubmit = async () => {
  error.value = null;
  const res = await authClient.signIn.email({ email: email.value, password: password.value });
  if (res.error) {
    error.value = res.error.message ?? "Unable to sign in";
    return;
  }
  window.location.href = "/account";
};

const onGithub = async () => {
  await authClient.signIn.social({ provider: "github" });
};
</script>
