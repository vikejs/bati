import type { Generated, Insertable, Selectable } from "kysely";

export interface Database {
  todos: TodoTable;
}

export interface TodoTable {
  id: Generated<number>;
  text: string;
}

export type Todo = Selectable<TodoTable>;
export type NewTodo = Insertable<TodoTable>;
