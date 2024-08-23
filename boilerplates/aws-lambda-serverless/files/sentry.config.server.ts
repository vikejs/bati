//# BATI include-if-imported
import * as Sentry from "@sentry/aws-serverless";
// import { nodeProfilingIntegration } from "@sentry/profiling-node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // debug: true,
  // integrations: [nodeProfilingIntegration()],
  // Add Tracing by setting tracesSampleRate and adding integration
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
