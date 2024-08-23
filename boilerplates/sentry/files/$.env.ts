import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getServerlessEnv(props: TransformerProps) {
  const sentryDNS = process.env.TEST_SENTRY_DSN;
  const sentryOrg = process.env.TEST_SENTRY_ORG;
  const sentryProject = process.env.TEST_SENTRY_PROJECT;
  const sentryAuthToken = process.env.TEST_SENTRY_AUTH_TOKEN;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(
    envContent,
    "SENTRY_DSN",
    sentryDNS ?? "",
    "Sentry DNS. Used for Error Reporting on the Server",
  );
  envContent = appendToEnv(
    envContent,
    "PUBLIC_ENV__SENTRY_DSN",
    "",
    "Sentry DNS. Used for Error Reporting in the Browser",
  );

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

  return envContent;
}
