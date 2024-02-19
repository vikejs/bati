import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  const envContent = await props.readfile?.();

  const envs = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  envs.forEach((key) => {
    appendToEnv(envContent, key, "");
  });

  return appendToEnv(envContent, "GOOGLE_APPLICATION_CREDENTIALS", ".firebase/service-account.json");
}
