import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("ts-rest");
  },
  knip: {
    ignoreDependencies: ["zod"],
  },
  // Data-fetching/RPC skill (SKILLS_PLAN.md §6.F).
  skills() {
    return [
      {
        name: "ts-rest",
        description:
          "How to add an endpoint with ts-rest in this app. Use when adding a typed REST route shared between client and server.",
        body: `ts-rest is contract-first. The contract is in \`ts-rest/contract.ts\` (\`c.router({...}, { pathPrefix: "/api" })\`); the typed client is \`ts-rest/client.ts\`; the server implements it in \`server/ts-rest-handler.ts\`.

- **Add an endpoint:** add an entry to the contract (\`method\`, \`path\`, \`body\`/\`responses\` via \`c.type<...>()\`), then implement it in \`server/ts-rest-handler.ts\`.
- **Call it:** from a component, use the client in \`ts-rest/client.ts\` — \`await client.<name>({ ... })\` — fully typed from the contract.

See https://ts-rest.com/docs.`,
      },
    ];
  },
});
