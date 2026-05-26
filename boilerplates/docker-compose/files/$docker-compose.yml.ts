import { composeEnvEntries, setComposeEnvironment, type TransformerProps } from "@batijs/core";

// Inject the selected features' env vars into services.app.environment from the
// merged registry, so this boilerplate no longer hardcodes auth0/sentry/db vars.
export default async function getDockerCompose(props: TransformerProps): Promise<unknown> {
  const code = await props.readfile?.();
  if (!code) return;

  return setComposeEnvironment(code, composeEnvEntries(props.env, props.meta));
}
