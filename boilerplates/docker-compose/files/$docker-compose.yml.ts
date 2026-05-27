import { setComposeEnvironment, type TransformerProps } from "@batijs/core";
import { composeEnvEntries } from "../env";

export default async function getDockerCompose(props: TransformerProps): Promise<string> {
  // biome-ignore lint/style/noNonNullAssertion: docker-compose.yml is always copied first
  const code = await props.readfile!();

  // Inject env vars
  return setComposeEnvironment(code, composeEnvEntries(props.env));
}
