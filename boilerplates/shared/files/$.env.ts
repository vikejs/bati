import type { TransformerProps } from "@batijs/core";
import { renderDotenv } from "../env";

// Sole producer of `.env`: emits every selected feature's env vars from the
// merged registry. Returns undefined (writes no file) when nothing applies.
export default function getEnv(props: TransformerProps): unknown {
  return renderDotenv(props.env, props.meta);
}
