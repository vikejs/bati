import type { ColumnType, Generated, Insertable, Selectable } from "kysely";

export interface Database {
  todos: TodoTable;
}

export interface TodoTable {
  id: Generated<number>;
  text: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Todo = Selectable<TodoTable>;
export type NewTodo = Insertable<TodoTable>;
