import type { TransformerProps } from "@batijs/core";
import { renderDotenv } from "../env";

export default function getEnv(props: TransformerProps) {
  return renderDotenv(props.env, props.meta);
}
