import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getServerlessEnv(props: TransformerProps) {
  if (!props.meta.BATI.has("sentry")) return undefined;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(
    envContent,
    "SENTRY_PROFILER_BINARY_PATH",
    process.env.SENTRY_PROFILER_BINARY_PATH ?? "",
    "SENTRY_PROFILER_BINARY_PATH. Needed for location of profiler binary",
  );

  return envContent;
}
