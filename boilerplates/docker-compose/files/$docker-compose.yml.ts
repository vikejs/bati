import { setComposeEnvironment, type TransformerProps } from "@batijs/core";
import { composeEnvEntries } from "../env";

export default async function getDockerCompose(props: TransformerProps): Promise<string> {
  // biome-ignore lint/style/noNonNullAssertion: docker-compose.yml is always copied first
  const code = await props.readfile!();

  // Inject env vars
  let result = setComposeEnvironment(code, composeEnvEntries(props.env));

  // Declare the named volume backing the `postgres` service. Added here rather than
  // in the template because a YAML comment on the first child of a mapping attaches
  // to the parent, so an inline `# BATI.has(...)` guard there can't be evaluated.
  if (props.meta.BATI.has("postgres")) {
    result = `${result.trimEnd()}\n\nvolumes:\n  postgres_data:\n`;
  }

  return result;
}
