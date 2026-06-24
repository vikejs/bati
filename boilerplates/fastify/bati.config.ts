import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("fastify");
  },
  knip: {
    entry: ["+server.ts"],
  },
  // Server skill — how to add routes/middleware to this server's Vike entry.
  skills() {
    return [
      {
        name: "server",
        description:
          "How to add a server route or middleware in this Fastify + Vike app. Use when adding an API endpoint, middleware, or changing server behavior.",
        body: `The server entry is \`+server.ts\`, which builds a Fastify \`app\` and mounts Vike with \`await vike(app, [...])\` (the array holds Universal Middlewares: db, auth, RPC handlers). The \`fastify-raw-body\` plugin is registered so middlewares can read the request body.

- **Add an API route:** register it on the Fastify \`app\` before the \`vike(app, …)\` call, e.g. \`app.get("/api/hello", () => ({ ok: true }))\`, or \`app.register(myPlugin)\`.
- **Add middleware:** push a Universal Middleware handler into the \`vike(app, [...])\` array to share Vike's \`context\`.
- \`PORT\` is read from the environment.

See https://vike.dev/server and https://fastify.dev.`,
      },
    ];
  },
});
