export { onNewTodo };

import { type TodoItem, todoItems } from "../../database/todoItems";

async function onNewTodo({ text }: TodoItem) {
  todoItems.push({ text });
  return { todoItems };
}
