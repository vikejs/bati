import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("plausible.io");
  },
  // Analytics skill (SKILLS_PLAN.md §6.N).
  skills() {
    return [
      {
        name: "analytics",
        description:
          "How analytics works in this app (Plausible). Use when configuring analytics or tracking events.",
        body: `Plausible analytics. The tracking script lives in \`pages/+Head.*\`.

- **Configure:** set the \`data-domain\` attribute on the Plausible \`<script>\` to your domain.
- **Custom events:** use the Plausible script API (\`window.plausible("<event>")\`); enable the events extension on the script tag if needed.

See https://plausible.io/docs.`,
      },
    ];
  },
});
