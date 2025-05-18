import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const betterAuthClientSecret = process.env.BETTER_AUTH_SECRET || Math.random().toString(36);

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "BETTER_AUTH_URL", betterAuthUrl ?? "", "Better-Auth Base Url");
  envContent = appendToEnv(envContent, "BETTER_AUTH_SECRET", betterAuthClientSecret ?? "", "Better-Auth Client Secret");

  return envContent;
}
