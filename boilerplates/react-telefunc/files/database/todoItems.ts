export type TodoItem = { text: string };
export const todoItems: TodoItem[] = [];
init();

// Initial data
function init() {
  todoItems.push({ text: "Buy milk" });
  todoItems.push({ text: "Buy strawberries" });
}
