import type postgres from "postgres";

export function insertTodo(sql: postgres.Sql, text: string) {
  return sql`INSERT INTO todos (text) VALUES (${text})`;
}

export function getAllTodos(sql: postgres.Sql) {
  return sql<{ id: number; text: string }[]>`SELECT id, text FROM todos ORDER BY id`;
}
