/*# BATI include-if-imported #*/
import { db } from "../db";
import { todoTable } from "../schema/todos";

export function insertTodo(text: string) {
  return db().insert(todoTable).values({ text });
}

export function getAllTodos() {
  return db().select().from(todoTable).all();
}
