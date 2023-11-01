import { todoItems, type TodoItem } from "@batijs/shared-db/database/todoItems";

export async function onNewTodo({ text }: TodoItem) {
  todoItems.push({ text });
  return { todoItems };
}
