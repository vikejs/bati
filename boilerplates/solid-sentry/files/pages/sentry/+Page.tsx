import * as Sentry from "@sentry/solid";
import { createSignal, onMount } from "solid-js";

export default function SolidSentryErrorPage() {
  const [sentryClientStatus, setSentryClientStatus] = createSignal({
    client_not_loaded: false,
    enabled: true,
    dsn_missing: false,
  });

  onMount(() => {
    const options = Sentry?.getClient()?.getOptions();
    setSentryClientStatus({
      client_not_loaded: !options,
      dsn_missing: (options?.dsn?.length ?? 0) < 2,
      enabled: (options?.enabled ?? true) !== false,
    });
    console.log("Sentry DSN: ", options?.dsn);
  });

  return (
    <>
      <h1>Sentry Test Page</h1>
      {(sentryClientStatus().client_not_loaded ||
        sentryClientStatus().dsn_missing ||
        !sentryClientStatus().enabled) && (
        <p style={{ color: "red" }}>
          <b>Sentry Config Error:</b> {sentryClientStatus().client_not_loaded ? "Client not loaded!" : ""}{" "}
          {!sentryClientStatus().client_not_loaded && sentryClientStatus().dsn_missing ? "DSN is missing! " : ""}
          {!sentryClientStatus().client_not_loaded && !sentryClientStatus().enabled
            ? "Client is not enabled! "
            : ""}{" "}
          Vite Mode: {import.meta.env.PROD ? "PROD" : "DEV"}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={() => {
            throw new Error(`This is a Solid SENTRY Browser Test! [${import.meta.env.DEV ? "DEV Mode" : "PROD Mode"}]`);
          }}
        >
          Throw Javascript Error
        </button>
      </div>
    </>
  );
}
