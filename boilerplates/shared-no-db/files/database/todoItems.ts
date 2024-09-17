interface TodoItem {
  text: string;
}

const todosDefault = [{ text: "Buy milk" }, { text: "Buy strawberries" }];

const database: { todos: TodoItem[] } =
  // We create a in-memory database.
  // - We use globalThis so that the database isn't reset upon HMR.
  // - The database is reset when restarting the server, use a proper database (SQLite/PostgreSQL/...) if you want persistent data.
  // biome-ignore lint:
  ((globalThis as any).__database ??= { todos: todosDefault });

const { todos } = database;

export { todos };
export type { TodoItem };
