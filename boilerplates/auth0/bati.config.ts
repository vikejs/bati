import type { EnvSink } from "@batijs/core";
import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("auth0");
  },
  env: (meta) => {
    // Under cloudflare, Auth0 secrets are managed by wrangler, not the .env file.
    const sinks: EnvSink[] | undefined = meta.BATI.has("cloudflare") ? ["compose", "dockerfile"] : undefined;
    return [
      {
        key: "AUTH0_CLIENT_ID",
        scope: "secret",
        comment: "Auth0 Client ID",
        devValueFrom: "TEST_AUTH0_CLIENT_ID",
        group: "auth0",
        sinks,
      },
      {
        key: "AUTH0_CLIENT_SECRET",
        scope: "secret",
        comment: "Auth0 Client Secret",
        devValueFrom: "TEST_AUTH0_CLIENT_SECRET",
        group: "auth0",
        sinks,
      },
      {
        key: "AUTH0_ISSUER_BASE_URL",
        scope: "secret",
        comment: "Auth0 base URL",
        devValueFrom: "TEST_AUTH0_ISSUER_BASE_URL",
        group: "auth0",
        sinks,
      },
    ];
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Add the Auth0 configuration to the .env file. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
});
