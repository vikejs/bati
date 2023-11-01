import { todoItems, type TodoItem } from "@batijs/shared-db/database/todoItems";

export { onNewTodo };

async function onNewTodo({ text }: TodoItem) {
  todoItems.push({ text });
  return { todoItems };
}
