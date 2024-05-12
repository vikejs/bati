import "firebaseui/dist/firebaseui.css";
import { startFirebaseUI } from "@batijs/firebase-auth/libs/firebaseUI";
import { getAuth, type UserCredential } from "firebase/auth";
import * as firebaseui from "firebaseui";
import { createEffect, createSignal } from "solid-js";
import { reload } from "vike/client/router";

export default Page;

function Page() {
  const [error, setError] = createSignal("");

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
        setError(response.statusText);
      }
      await getAuth().signOut();
    } catch (err) {
      console.log("error :", err);
    }
  }

  createEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(getAuth());
    if (!error()) {
      startFirebaseUI(ui, sessionLogin);
    }
  });

  return (
    <>
      <div id="firebaseui-auth-container" />
      {error() && (
        <>
          <div style={{ color: "red" }}>There is an error occured : {error()}</div>
          <button onClick={() => setError("")}>Try Again</button>
        </>
      )}
    </>
  );
}
