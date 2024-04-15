import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const envContent = await props.readfile?.();

  if (props.meta.BATI.has("auth0")) {
    return appendToEnv(envContent, "SECRET", "LONG_RANDOM_STRING");
  }

  return null;
}
