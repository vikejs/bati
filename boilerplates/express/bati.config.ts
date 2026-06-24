import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("express");
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
          "How to add a server route or middleware in this Express + Vike app. Use when adding an API endpoint, middleware, or changing server behavior.",
        body: `The server entry is \`+server.ts\`, which builds an Express \`app\` and mounts Vike with \`vike(app, [...])\` (the array holds Universal Middlewares: db, auth, RPC handlers).

- **Add an API route:** register it on the Express \`app\` before the \`vike(app, …)\` call, e.g. \`app.get("/api/hello", (req, res) => res.json({ ok: true }))\`.
- **Add middleware:** use \`app.use(...)\`, or push a Universal Middleware handler into the \`vike(app, [...])\` array to share Vike's \`context\`.
- \`PORT\` is read from the environment.

See https://vike.dev/server and https://expressjs.com.`,
      },
    ];
  },
});
