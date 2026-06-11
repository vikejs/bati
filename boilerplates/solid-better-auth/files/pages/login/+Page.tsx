import { createAuthClient } from "better-auth/solid";
import { createSignal, Show } from "solid-js";
import { navigate } from "vike/client/router";

const authClient = createAuthClient();

export default function Page() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  return (
    <>
      <h1>Sign in</h1>
      <form
        onSubmit={async (ev) => {
          ev.preventDefault();
          setError(null);
          const res = await authClient.signIn.email({ email: email(), password: password() });
          if (res.error) {
            setError(res.error.message ?? "Unable to sign in");
            return;
          }
          await navigate("/account");
        }}
      >
        <p>
          <input
            type="email"
            aria-label="Email"
            placeholder="Email"
            required
            value={email()}
            onInput={(ev) => setEmail(ev.currentTarget.value)}
            // $$.BATI.has("tailwindcss")
            class={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
        </p>
        <p>
          <input
            type="password"
            aria-label="Password"
            placeholder="Password"
            required
            value={password()}
            onInput={(ev) => setPassword(ev.currentTarget.value)}
            // $$.BATI.has("tailwindcss")
            class={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
        </p>
        <button
          type="submit"
          // $$.BATI.has("tailwindcss")
          class={
            "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
          }
        >
          Sign in
        </button>
      </form>
      <p>or</p>
      <button
        type="button"
        onClick={async () => {
          await authClient.signIn.social({ provider: "github" });
        }}
        // $$.BATI.has("tailwindcss")
        class={
          "text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:outline-hidden focus:ring-gray-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
        }
      >
        Sign in with GitHub
      </button>
      <Show when={error()}>
        <p role="alert">{error()}</p>
      </Show>
      <p>
        No account? <a href="/signup">Sign up</a>
      </p>
    </>
  );
}
