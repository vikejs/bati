import { db } from "../db";

export function insertTodo(text: string) {
  return db().prepare("INSERT INTO todos (text) VALUES (?)").run(text);
}

export function getAllTodos() {
  return db().prepare<[], { id: number; text: string }>("SELECT * FROM todos").all();
}
