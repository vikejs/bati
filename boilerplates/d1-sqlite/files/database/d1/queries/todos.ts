export function insertTodo(db: D1Database, text: string) {
  return db.prepare("INSERT INTO todos (text) VALUES (?)").bind(text).run();
}

export async function getAllTodos(db: D1Database) {
  const { results } = await db.prepare("SELECT * FROM todos").all<{ id: number; text: string }>();
  return results;
}
