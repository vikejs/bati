/*{ @if (!(it.BATI.has("react") || it.BATI.has("vue") || it.BATI.has("solid"))) }*/
export { Page };

function Page() {
  // language=HTML
  return `
<h1>Sentry Test Page</h1>
<p id="sentry_state" style="color:red">
    Sentry Client is not initialized! Vite Mode: ${import.meta.env.PROD ? "PROD" : "DEV"}
</p>
<p id="sentry_dsn" style="color:red">
    Sentry Client DSN is missing! Vite Mode: ${import.meta.env.PROD ? "PROD" : "DEV"}
</p>
<div>
    <button id="errorButton">
        Throw JavaScript Error
    </button>
</div>
`;
}
/*{ /if }*/
