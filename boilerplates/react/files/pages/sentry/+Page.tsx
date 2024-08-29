import React from "react";
import * as Sentry from "@sentry/react";

export default function Page() {
  return (
    <>
      <h1>Sentry Browser React</h1>
      {!Sentry.getClient() && (
        <div style={{ color: "red" }}>
          Sentry Client is not initialized! Vite Mode: {import.meta.env.PROD ? "PROD" : "DEV"}
        </div>
      )}

      <ul>
        <li>
          <button
            onClick={() => {
              throw new Error(
                `This is a SENTRY Browser React Test! [${import.meta.env.DEV ? "DEV Mode" : "PROD Mode"}]`,
              );
            }}
          >
            Throw Javascript Error
          </button>
        </li>
      </ul>
    </>
  );
}
