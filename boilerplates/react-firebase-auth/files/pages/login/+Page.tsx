import "firebaseui/dist/firebaseui.css"
import React, { useEffect, useState } from 'react'
import firebase from "firebase/compat/app"
import * as firebaseui from "firebaseui"
import { getAuth, type UserCredential } from 'firebase/auth'
import { reload } from "vike/client/router"

export default Page

function Page() {
    const [error, setError] = useState("")

    useEffect(() => {
        const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(getAuth())
        if (!error) {
            // Please read firebaseui docs at https://github.com/firebase/firebaseui-web
            ui.start("#firebaseui-auth-container", {
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
                                    setError(response.statusText)
                                }
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
            })
        }
    }, [error])

    return (
        <>
            <div id="firebaseui-auth-container"></div>
            {error && (
                <>
                    <div style={{ color: "red" }}>There is an error occured : {error}</div>
                    <button onClick={() => setError("")}>Try Again</button>
                </>
            )}
        </>
    )
}