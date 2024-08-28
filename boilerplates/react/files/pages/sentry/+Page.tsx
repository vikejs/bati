import React from "react";

export default function Page() {
  return (
    <>
      <h1>Sentry Browser React</h1>
      {import.meta.env.DEV && <div style={{ color: "red" }}>Sentry is disabled in DEV-Mode!</div>}
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
