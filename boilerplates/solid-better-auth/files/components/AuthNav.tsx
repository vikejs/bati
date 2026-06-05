import { createAuthClient } from "better-auth/solid";
import { Show } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";

const authClient = createAuthClient();

export function AuthNav() {
  const pageContext = usePageContext();

  return (
    <Show
      when={pageContext.user}
      fallback={
        <>
          <a href="/login">Login</a>
          <a href="/signup">Sign up</a>
        </>
      }
    >
      {(user) => (
        <>
          <span>{user().email}</span>
          <a
            href="/"
            onClick={async (ev) => {
              ev.preventDefault();
              await authClient.signOut();
              window.location.href = "/";
            }}
          >
            Sign out
          </a>
        </>
      )}
    </Show>
  );
}
