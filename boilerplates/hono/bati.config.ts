import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("hono");
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
          "How to add a server route or middleware in this Hono + Vike app. Use when adding an API endpoint, middleware, or changing server behavior.",
        body: `The server entry is \`+server.ts\` (it exports a Vike \`Server\`). The Hono \`app\` is built in \`server/hono.ts\`, where \`vike(app, [...])\` mounts Vike as the catch-all and the array holds Universal Middlewares (db, auth, RPC handlers).

- **Add an API route:** register it on the Hono \`app\` in \`server/hono.ts\`, e.g. \`app.get("/api/hello", (c) => c.json({ ok: true }))\`.
- **Add middleware:** use \`app.use(...)\`, or push a Universal Middleware handler into the \`vike(app, [...])\` array to share Vike's \`context\`.
- \`PORT\` is read from the environment.

See https://vike.dev/server and https://hono.dev.`,
      },
    ];
  },
});
