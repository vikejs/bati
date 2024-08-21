import { type TransformerProps } from "@batijs/core";

export default async function activateSentryEsbuildSourcemapsPlugin(props: TransformerProps) {
  // commonjs
  const esbuildPlugin = props.meta.BATI.has("sentry")
    ? `/* eslint-disable */
    const {sentryEsbuildPlugin}=require("@sentry/esbuild-plugin");
    const plugin=sentryEsbuildPlugin({
        org: "andreas-heissenberger",
        project: process.env.SENTRY_PROJECT,

        // Specify the directory containing build artifacts
        //include: outdir,

        // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
        // and need project:releases and org:read scopes
        authToken: process.env.SENTRY_AUTH_TOKEN,

        // Optionally uncomment the line below to override automatic release name detection
        // release: process.env.RELEASE,
        //release: process.env.SENTRY_RELEASE
    })
    
    module.exports = plugin;
    `
    : `/* eslint-disable */
module.exports = {};`;
  return esbuildPlugin;
}
