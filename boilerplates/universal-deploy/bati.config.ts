import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.hasUD;
  },
  // Self-host deploy skill (SKILLS_PLAN.md §6.K) — only for the DIY hosting option; managed hosts
  // (cloudflare/vercel/…) emit their own 'deploy' skill, so this stays empty there to avoid a clash.
  skills(meta) {
    if (!meta.BATI.has("hosting-diy")) return [];
    const run = meta.BATI.pmRun;
    const serverNote = meta.BATI.hasServer
      ? "runs as a Node server (the `prod` script boots it)"
      : "served as static assets";
    return [
      {
        name: "deploy",
        description: "How to build and self-host this app. Use when deploying to your own server or VPS.",
        body: `Self-hosted (no managed platform); ${serverNote}.

- **Build:** \`${run} build\`.
- **Run in production:** \`${run} prod\`.
- **Env vars:** provide them in the environment (or \`.env\`) on your server.

See \`TODO.md\`.`,
      },
    ];
  },
});
