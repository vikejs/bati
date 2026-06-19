import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("google-analytics");
  },
  env: () => [
    {
      key: "PUBLIC_ENV__GOOGLE_ANALYTICS",
      scope: "public",
      default: "G-XXXXXXXXXX",
      comment: `Google Analytics

See the documentation https://support.google.com/analytics/answer/9304153?hl=en#zippy=%2Cweb`,
    },
  ],
  // Analytics skill (SKILLS_PLAN.md §6.N).
  skills() {
    return [
      {
        name: "analytics",
        description:
          "How analytics works in this app (Google Analytics). Use when configuring analytics or tracking events.",
        body: `Google Analytics (gtag). The tag is injected in \`pages/+Head.*\` and reads \`PUBLIC_ENV__GOOGLE_ANALYTICS\`.

- **Configure:** set \`PUBLIC_ENV__GOOGLE_ANALYTICS\` (your \`G-XXXX\` measurement ID) in \`.env\`.
- **Track events:** call \`gtag("event", "<name>", { ... })\` in the browser.

See https://developers.google.com/analytics.`,
      },
    ];
  },
});
