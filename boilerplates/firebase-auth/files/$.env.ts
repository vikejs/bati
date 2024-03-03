import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const envContent = await props.readfile?.();

  return appendToEnv(
    envContent,
    "GOOGLE_APPLICATION_CREDENTIALS",
    "firebase/service-account.json",
    `Location of Your Firebase service account (use for firebase-admin).
Download the file from https://console.firebase.google.com/u/0/project/{firebase-project-id}/settings/serviceaccounts/adminsdk`,
  );
}
