import { todoItems, type TodoItem } from "../../database/todoItems";

export async function onNewTodo({ text }: TodoItem) {
  todoItems.push({ text });
  return { todoItems };
}
