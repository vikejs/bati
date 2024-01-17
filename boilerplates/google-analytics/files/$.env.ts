import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const envContent = await props.readfile?.();

  return appendToEnv(
    envContent,
    "PUBLIC_ENV__GOOGLE_ANALYTICS",
    "G-XXXXXXXXXX",
    `Google Analytics

See the documentation https://support.google.com/analytics/answer/9304153?hl=en#zippy=%2Cweb`,
  );
}
