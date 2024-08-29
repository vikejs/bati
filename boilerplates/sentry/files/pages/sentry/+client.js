/*{ @if (!(it.BATI.has("react") || it.BATI.has("vue") || it.BATI.has("solid"))) }*/
import "../+client";

window.onload = function () {
  // @ts-ignore
  const options = globalThis?.window?.Sentry?.getClient()?.getOptions();
  if (options) {
    const elmSentryState = document.getElementById("sentry_state");
    if (elmSentryState) elmSentryState.hidden = true;
    if (options?.dsn?.length > 1) {
      const elmSentryDSN = document.getElementById("sentry_dsn");
      if (elmSentryDSN) elmSentryDSN.hidden = true;
    }
  }
  const elmSentryButton = document.getElementById("errorButton");
  if (elmSentryButton)
    elmSentryButton.addEventListener("click", function () {
      // @ts-ignore
      throw new Error("This is a SENTRY Browser Test!");
    });
};
/*{ /if }*/
