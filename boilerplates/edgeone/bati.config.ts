import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("edgeone");
  },
  knip: {
    ignore: [".edgeone/**"],
  },
  // Deploy skill (SKILLS_PLAN.md §6.K).
  skills(meta) {
    const pm = meta.BATI.pm;
    const run = pm === "pnpm" || pm === "yarn" ? pm : `${pm} run`;
    return [
      {
        name: "deploy",
        description: "How to deploy this app to EdgeOne Pages. Use when deploying or managing environment variables.",
        body: `Deploys to Tencent EdgeOne Pages.

- **Deploy:** push to an EdgeOne-connected Git repo (or use the EdgeOne CLI). \`${run} build\` builds locally.
- **Env vars:** set them in the EdgeOne Pages dashboard; locally they're in \`.env\`.

See https://edgeone.ai/document/pages and \`TODO.md\`.`,
      },
    ];
  },
});
