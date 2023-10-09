import { createSignal } from "solid-js";
import type { TodoItem } from "../../database/todoItems";
import { TodoList } from "./TodoList";

export default function Page(props: { initialTodoItems: TodoItem[] }) {
  return (
    <>
      <h1>To-do List</h1>
      <TodoList initialTodoItems={props.initialTodoItems} />
      <Counter />
    </>
  );
}

function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      This page is interactive:
      <button type="button" onClick={() => setCount((count) => count + 1)}>
        Counter {count()}
      </button>
    </div>
  );
}
