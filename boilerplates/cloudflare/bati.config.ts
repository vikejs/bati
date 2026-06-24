import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("cloudflare");
  },
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} wrangler types`,
      },
    ];
  },
  enforce: "post",
  knip: {
    entry: ["cloudflare-entry.ts"],
    ignoreDependencies: ["wrangler", "cloudflare", "@cloudflare/vite-plugin"],
  },
  // Deploy skill.
  skills(meta) {
    const run = meta.BATI.pmRun;
    const d1Note = meta.BATI.hasD1 ? " D1 is bound as `DB`; apply migrations with `wrangler d1 migrations apply`." : "";
    return [
      {
        name: "deploy",
        description:
          "How to deploy this app to Cloudflare. Use when deploying, configuring bindings, or managing secrets.",
        body: `Deploys to Cloudflare Workers via Wrangler. The worker entry is \`cloudflare-entry.ts\`; config is \`wrangler.jsonc\`.

- **Deploy:** \`${run} deploy\` (runs \`vike build && wrangler deploy\`).
- **Types:** \`${run} generate-types\` after changing bindings.
- **Secrets:** \`wrangler secret put <NAME>\` for production; non-secret vars live in \`wrangler.jsonc\` (\`vars\`).${d1Note}

See https://developers.cloudflare.com/workers and \`TODO.md\`.`,
      },
    ];
  },
});
