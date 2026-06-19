import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("netlify");
  },
  // Deploy skill (SKILLS_PLAN.md §6.K).
  skills(meta) {
    const run = meta.BATI.pmRun;
    return [
      {
        name: "deploy",
        description: "How to deploy this app to Netlify. Use when deploying or managing environment variables.",
        body: `Deploys to Netlify.

- **Deploy:** push to a Netlify-connected Git repo, or run \`netlify deploy\` (Netlify CLI). \`${run} build\` builds locally.
- **Env vars:** set them in the Netlify dashboard (Site settings → Environment variables); locally they're in \`.env\`.

See https://docs.netlify.com and \`TODO.md\`.`,
      },
    ];
  },
});
