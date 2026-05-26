import { renderDotenv, type TransformerProps } from "@batijs/core";

// Sole producer of `.env`: emits every selected feature's env vars from the
// merged registry. Returns undefined (writes no file) when nothing applies.
export default function getEnv(props: TransformerProps): unknown {
  return renderDotenv(props.env, props.meta);
}
