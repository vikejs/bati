import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("telefunc");
  },
  // Data-fetching/RPC skill (SKILLS_PLAN.md §6.F).
  skills() {
    return [
      {
        name: "telefunc",
        description:
          "How to add an RPC function with Telefunc in this app. Use when adding a data mutation or server function callable from the client.",
        body: `Telefunc exposes server functions ("telefunctions") that the client imports and calls directly — no manual API route.

- **Add one:** create a \`*.telefunc.ts\` file (colocate it with the component, e.g. \`pages/todo/TodoList.telefunc.ts\`) and \`export async function\` your telefunctions.
- **Call it:** \`import { onNewTodo } from "./TodoList.telefunc"\` in a component and \`await onNewTodo({ ... })\`. Telefunc replaces the import with a network call.
- **Server context:** \`import { getContext } from "telefunc"\` to read request context (e.g. \`context.db\`, the user session).
- **Guard inputs** with \`shield\` (https://telefunc.com/shield); the route is wired in \`server/telefunc-handler.ts\`.

See https://telefunc.com.`,
      },
    ];
  },
});
