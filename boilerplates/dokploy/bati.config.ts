import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("dokploy");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `${bold("dokploy")}: Check ${bold("TODO.md")} for remaining steps.`,
      },
    ];
  },
  enforce: "post",
  // Deploy skill (SKILLS_PLAN.md §6.K).
  skills() {
    return [
      {
        name: "deploy",
        description: "How to deploy this app with Dokploy. Use when deploying to a Dokploy server.",
        body: `Deploys via Dokploy (self-hosted PaaS) using the app's \`Dockerfile\`.

- **Deploy:** connect the Git repo in your Dokploy dashboard; Dokploy builds and runs the container.
- **Env vars:** set them in the Dokploy app's Environment settings.

See https://docs.dokploy.com and \`TODO.md\`.`,
      },
    ];
  },
});
