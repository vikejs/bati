import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("vercel");
  },
  knip: {
    ignore: [".vercel/**"],
    ignoreDependencies: ["vite-plugin-vercel"],
  },
  // Deploy skill (SKILLS_PLAN.md §6.K).
  skills(meta) {
    const pm = meta.BATI.pm;
    const run = pm === "pnpm" || pm === "yarn" ? pm : `${pm} run`;
    return [
      {
        name: "deploy",
        description: "How to deploy this app to Vercel. Use when deploying or managing environment variables.",
        body: `Deploys to Vercel (build via \`vite-plugin-vercel\`, output in \`.vercel/output\`).

- **Deploy:** push to a Vercel-connected Git repo, or run the \`vercel\` CLI. \`${run} build\` produces the output locally.
- **Env vars:** set them in the Vercel dashboard (Project → Settings → Environment Variables); locally they're in \`.env\`.

See https://vercel.com/docs and \`TODO.md\`.`,
      },
    ];
  },
});
