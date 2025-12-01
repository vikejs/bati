import type { TransformerProps } from "@batijs/core";

const plugin = `{
  name: "aws",
  apply: "build",

  applyToEnvironment(env) {
    return env.name === "ssr";
  },

  buildStart() {
    // Force emit an entry that can be used to retrieve the Hono app
    this.emitFile({
      type: "chunk",
      fileName: "aws.mjs",
      id: "virtual:photon:server-entry",
    });
  }
}`;

export default async function getViteConfig(props: TransformerProps) {
  // biome-ignore lint/style/noNonNullAssertion: always exists
  const viteConfig = await props.readfile!();

  return viteConfig.replace("plugins: [", `plugins: [${plugin}, `);
}
