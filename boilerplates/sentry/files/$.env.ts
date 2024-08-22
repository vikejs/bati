import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getServerlessEnv(props: TransformerProps) {
  const sentryDNS = process.env.TEST_SENTRY_DSN;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "SENTRY_DSN", sentryDNS ?? "", "Sentry DNS. Used for Error Reporting");
  envContent = appendToEnv(
    envContent,
    "PUBLIC_ENV__SENTRY_DSN",
    "${SENTRY_DSN}",
    "Sentry DNS. Used for Error Reporting in the Browser",
  );

  return envContent;
}
