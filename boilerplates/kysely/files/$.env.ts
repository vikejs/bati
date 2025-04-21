import { appendToEnv, type TransformerProps } from "@batijs/core";

export default async function getEnv(props: TransformerProps) {
  if (props.meta.BATI.hasD1) return;
  const envContent = await props.readfile?.();

  return appendToEnv(envContent, "DATABASE_URL", "sqlite.db", "Path to the sqlite database");
}
