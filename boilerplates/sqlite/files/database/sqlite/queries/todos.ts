import type { Database } from "better-sqlite3";

export function insertTodo(db: Database, text: string) {
  return db.prepare("INSERT INTO todos (text) VALUES (?)").run(text);
}

export function getAllTodos(db: Database) {
  return db.prepare<[], { id: number; text: string }>("SELECT * FROM todos").all();
}
