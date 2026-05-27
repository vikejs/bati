import { setComposeEnvironment, type TransformerProps } from "@batijs/core";
import { composeEnvEntries } from "../env";

// Inject the selected features' env vars into services.app.environment from the
// merged registry, so this boilerplate no longer hardcodes auth0/sentry/db vars.
export default async function getDockerCompose(props: TransformerProps): Promise<string> {
  // biome-ignore lint/style/noNonNullAssertion: docker-compose.yml is always copied first
  const code = await props.readfile!();

  return setComposeEnvironment(code, composeEnvEntries(props.env, props.meta));
}
