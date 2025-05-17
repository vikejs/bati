import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const auth0ClientSecret = process.env.BETTER_AUTH_SECRET || Math.random().toString(36);

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "BETTER_AUTH_SECRET", auth0ClientSecret ?? "", "Better-Auth Client Secret");

  return envContent;
}
