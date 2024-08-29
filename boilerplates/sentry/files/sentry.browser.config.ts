//# BATI.has("REMOVE-COMMENT") || "remove-comments-only"
//# BATI include-if-imported

/*{ @if (it.BATI.has("react")) }*/
// @ts-ignore
import * as Sentry from "@sentry/react";
/*{ /if}*/
/*{ @if (it.BATI.has("solid")) }*/
// @ts-ignore
import * as Sentry from "@sentry/solid";
/*{ /if}*/
/*{ @if (it.BATI.has("vue")) }*/
// @ts-ignore
import * as Vue from "vue";
// @ts-ignore
import * as Sentry from "@sentry/vue";
/*{ /if}*/
/*{ @if (!(it.BATI.has("react") || it.BATI.has("solid") || it.BATI.has("vue"))) }*/
// @ts-ignore
import * as Sentry from "@sentry/browser";
/*{ /if}*/

// eslint-disable-next-line
import.meta.env.PROD === true &&
  Sentry.init({
    /*{ @if (it.BATI.has("vue")) }*/
    // @ts-ignore
    Vue,
    /*{ /if}*/
    dsn: import.meta.env.PUBLIC_ENV__SENTRY_DSN,
    environment: "production-frontend",
    //enabled: import.meta.env.DEV ? false : true,
    integrations: [Sentry.replayIntegration()],
    autoSessionTracking: globalThis?.window?.document ? true : false, // disable autoSessionTracking in SSR
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    tracesSampleRate: 1.0,
    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

/*{ @if (!(it.BATI.has("react") || it.BATI.has("solid") || it.BATI.has("vue"))) }*/
// @ts-ignore
window.Sentry = Sentry;
/*{ /if}*/
