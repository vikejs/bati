import { type TransformerProps } from "@batijs/core";

export default async function getServerlessEnv(props: TransformerProps) {
  const serverlessENV = {
    NODE_ENV: "production",
    ...(props.meta.BATI.has("sentry")
      ? {
          SENTRY_DSN: "${env:SENTRY_DSN }",
          SENTRY_ENVIRONMENT: "${self:provider.stage}",
          SENTRY_PROFILER_BINARY_PATH: "${env:SENTRY_PROFILER_BINARY_PATH}",
        }
      : {}),
  };
  return serverlessENV;
}
