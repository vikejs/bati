// https://vike.dev/data
import { todoItems } from "@batijs/shared-db/database/todoItems";

export type Data = ReturnType<typeof data>;

export default function data() {
  const todoItemsInitial = todoItems;
  return todoItemsInitial;
}
