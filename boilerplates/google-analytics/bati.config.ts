import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("google-analytics");
  },
  env: [
    {
      key: "PUBLIC_ENV__GOOGLE_ANALYTICS",
      scope: "public",
      default: "G-XXXXXXXXXX",
      comment: `Google Analytics

See the documentation https://support.google.com/analytics/answer/9304153?hl=en#zippy=%2Cweb`,
    },
  ],
});
