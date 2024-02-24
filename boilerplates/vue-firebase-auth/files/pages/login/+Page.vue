<template>
  <div id="firebaseui-auth-container"></div>
  <div v-if="error">
    <div style="color:red">There is an error occured : {{ error }}</div>
    <button @click="clearError">Try Again</button>
  </div>
</template>

<script setup lang="ts">
import "firebaseui/dist/firebaseui.css"
import { ref, onMounted, onUpdated } from "vue";
import firebase from "firebase/compat/app"
import * as firebaseui from "firebaseui"
import { getAuth, type UserCredential } from 'firebase/auth'
import { reload } from "vike/client/router"
const error = ref("")
const clearError = () => error.value = ""
const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(getAuth())

const uiCOnfig = {
    callbacks: {
        signInSuccessWithAuthResult(authResult: UserCredential) {
            authResult.user.getIdToken().then((idToken) => {
                fetch("/api/sessionLogin", {
                    method: "POST",
                    body: JSON.stringify({ idToken }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(async (response) => {
                    if (response.ok) {
                        await reload()
                    } else {
                        error.value = response.statusText
                    }
                    await getAuth().signOut()
                })
            })
            // Don't redirect after firebase client successfully sign-in, let vike handle the rest.
            return false
        }
    },
    signInFlow: "popup",
    signInOptions: [
        // Disable "Email enumeration protection" to be able to login with registered email address
        // https://console.firebase.google.com/u/1/project/{project-id}/authentication/settings
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
}

onMounted(() => {
    ui.start("#firebaseui-auth-container", uiCOnfig)
})

onUpdated(() => {
    if (!error.value) {
        ui.start("#firebaseui-auth-container", uiCOnfig)
    }
})
</script>
