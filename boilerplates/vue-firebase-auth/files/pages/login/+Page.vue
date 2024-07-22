<template>
  <div id="firebaseui-auth-container"></div>
  <div v-if="error">
    <div style="color: red">There is an error occured : {{ error }}</div>
    <button @click="clearError">Try Again</button>
  </div>
</template>

<script setup lang="ts">
import "firebaseui/dist/firebaseui.css";
import { onMounted, onUpdated, ref } from "vue";
import * as firebaseui from "firebaseui";
import { getAuth, type UserCredential } from "firebase/auth";
import { reload } from "vike/client/router";
import { startFirebaseUI } from "@batijs/firebase-auth/libs/firebaseUI";

const error = ref("");
const clearError = () => (error.value = "");
const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(getAuth());

async function sessionLogin(authResult: UserCredential) {
  const idToken = (await authResult.user.getIdToken()) || "";
  try {
    const response = await fetch("/api/sessionLogin", {
      method: "POST",
      body: JSON.stringify({ idToken }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      await reload();
    } else {
      error.value = response.statusText;
    }
    await getAuth().signOut();
  } catch (err) {
    console.log("error :", err);
  }
}

onMounted(() => {
  startFirebaseUI(ui, sessionLogin);
});

onUpdated(() => {
  if (!error.value) {
    startFirebaseUI(ui, sessionLogin);
  }
});
</script>
