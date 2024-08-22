import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getServerlessEnv(props: TransformerProps) {
  if (!props.meta.BATI.has("sentry")) return undefined;
  const sentryOrg = process.env.TEST_SENTRY_ORG;
  const sentryProject = process.env.TEST_SENTRY_PROJECT;
  const sentryAuthToken = process.env.TEST_SENTRY_AUTH_TOKEN;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "SENTRY_ORG", sentryOrg ?? "", "Sentry Org. Used for Upload of Source Maps");
  envContent = appendToEnv(
    envContent,
    "SENTRY_PROJECT",
    sentryProject ?? "",
    "Sentry Project Slug. Used for Upload of Source Maps",
  );
  envContent = appendToEnv(
    envContent,
    "SENTRY_AUTH_TOKEN",
    sentryAuthToken ?? "",
    "Sentry Auth Token. Used for Upload of Source Maps",
  );
  envContent = appendToEnv(
    envContent,
    "SENTRY_PROFILER_BINARY_PATH",
    process.env.SENTRY_PROFILER_BINARY_PATH ?? "",
    "SENTRY_PROFILER_BINARY_PATH. Needed for location of profiler binary",
  );

  return envContent;
}
