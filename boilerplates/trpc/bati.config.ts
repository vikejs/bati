import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("trpc");
  },
  // Data-fetching/RPC skill (SKILLS_PLAN.md §6.F).
  skills() {
    return [
      {
        name: "trpc",
        description:
          "How to add a tRPC procedure in this app. Use when adding a typesafe query or mutation, or wiring a new endpoint into the router.",
        body: `The router lives in \`trpc/server.ts\` (\`appRouter\`); the typed client is \`trpc/client.ts\`. The route is mounted at \`/api/trpc\`.

- **Add a procedure:** add a key to \`appRouter\` in \`trpc/server.ts\` using \`publicProcedure.query(...)\` or \`.mutation(...)\`; add \`.input(...)\` to validate. The exported \`AppRouter\` type flows to the client automatically.
- **Call it:** from a component, \`import { trpc } from "../trpc/client"\` then \`await trpc.<name>.query(...)\` / \`.mutate(...)\`.
- **Server context** (e.g. \`ctx.db\`) is configured via \`initTRPC.context<...>()\` in \`trpc/server.ts\`.

See https://trpc.io/docs.`,
      },
    ];
  },
});
