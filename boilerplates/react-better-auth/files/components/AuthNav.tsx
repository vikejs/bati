import { createAuthClient } from "better-auth/react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";

const authClient = createAuthClient();

export function AuthNav() {
  const { user } = usePageContext();

  if (!user) {
    return (
      <>
        <a href="/login">Login</a>
        <a href="/signup">Sign up</a>
      </>
    );
  }

  return (
    <>
      <span>{user.email}</span>
      <a
        href="/"
        onClick={async (ev) => {
          ev.preventDefault();
          await authClient.signOut();
          await navigate("/");
        }}
      >
        Sign out
      </a>
    </>
  );
}
