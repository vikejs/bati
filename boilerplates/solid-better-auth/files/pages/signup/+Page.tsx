import { createAuthClient } from "better-auth/solid";
import { createSignal, Show } from "solid-js";
import { navigate } from "vike/client/router";

const authClient = createAuthClient();

export default function Page() {
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  return (
    <>
      <h1>Sign up</h1>
      <form
        onSubmit={async (ev) => {
          ev.preventDefault();
          setError(null);
          const res = await authClient.signUp.email({ name: name(), email: email(), password: password() });
          if (res.error) {
            setError(res.error.message ?? "Unable to sign up");
            return;
          }
          await navigate("/account");
        }}
      >
        <p>
          <input
            type="text"
            aria-label="Name"
            placeholder="Name"
            required
            value={name()}
            onInput={(ev) => setName(ev.currentTarget.value)}
            //# BATI.has("tailwindcss")
            class={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
        </p>
        <p>
          <input
            type="email"
            aria-label="Email"
            placeholder="Email"
            required
            value={email()}
            onInput={(ev) => setEmail(ev.currentTarget.value)}
            //# BATI.has("tailwindcss")
            class={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
        </p>
        <p>
          <input
            type="password"
            aria-label="Password"
            placeholder="Password (min. 8 characters)"
            required
            minLength={8}
            value={password()}
            onInput={(ev) => setPassword(ev.currentTarget.value)}
            //# BATI.has("tailwindcss")
            class={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
        </p>
        <button
          type="submit"
          //# BATI.has("tailwindcss")
          class={
            "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
          }
        >
          Sign up
        </button>
      </form>
      <Show when={error()}>
        <p role="alert">{error()}</p>
      </Show>
      <p>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </>
  );
}
