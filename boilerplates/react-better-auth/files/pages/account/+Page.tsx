import { createAuthClient } from "better-auth/react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";

const authClient = createAuthClient();

export default function Page() {
  const { user } = usePageContext();

  return (
    <>
      <h1>Account</h1>
      <p>
        Signed in as <strong>{user?.email}</strong>
      </p>
      {user?.name ? <p>Name: {user.name}</p> : null}
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          await navigate("/");
        }}
        //# $$.BATI.has("tailwindcss")
        className={
          "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
        }
      >
        Sign out
      </button>
    </>
  );
}
