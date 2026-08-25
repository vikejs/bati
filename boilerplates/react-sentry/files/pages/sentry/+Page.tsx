import * as Sentry from "@sentry/react";
import { useEffect, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function ReactSentryErrorPage() {
  // Sentry is initialized in the browser only, so read its client via useSyncExternalStore:
  // the server (and hydration) snapshot has no client, and the page re-renders with the real
  // client state right after hydration — without a setState inside an effect.
  const options = useSyncExternalStore(subscribe, () => Sentry?.getClient()?.getOptions(), () => undefined);
  const sentryClientStatus = {
    client_not_loaded: !options,
    dsn_missing: (options?.dsn?.length ?? 0) < 2,
    enabled: options?.enabled ?? true,
  };
  useEffect(() => {
    console.log("Sentry DSN: ", options?.dsn);
  }, [options]);

  return (
    <>
      <h1>Sentry Test Page</h1>
      {(sentryClientStatus.client_not_loaded || sentryClientStatus.dsn_missing || !sentryClientStatus.enabled) && (
        <p style={{ color: "red" }}>
          <b>Sentry Config Error:</b>
          {sentryClientStatus.client_not_loaded ? "Client not loaded!" : ""}{" "}
          {!sentryClientStatus.client_not_loaded && sentryClientStatus.dsn_missing ? "DSN is missing! " : ""}
          {!sentryClientStatus.client_not_loaded && !sentryClientStatus.enabled ? "Client is not enabled! " : ""} Vite
          Mode: {import.meta.env.PROD ? "PROD" : "DEV"}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={() => {
            throw new Error(`This is a React SENTRY Browser Test! [${import.meta.env.DEV ? "DEV Mode" : "PROD Mode"}]`);
          }}
        >
          Throw Javascript Error
        </button>
      </div>
    </>
  );
}
