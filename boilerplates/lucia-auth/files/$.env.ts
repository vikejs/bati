import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const githubClientId = process.env.TEST_GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.TEST_GITHUB_CLIENT_SECRET;

  let envContent = await props.readfile?.();

  envContent = appendToEnv(envContent, "GITHUB_CLIENT_ID", githubClientId ?? "", "Gihub Client ID");
  envContent = appendToEnv(envContent, "GITHUB_CLIENT_SECRET", githubClientSecret ?? "", "Gihub Client Secret");

  return envContent;
}
