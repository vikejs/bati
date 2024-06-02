import type { Data } from "@batijs/drizzle/pages/todo/+data";
import { createSignal } from "solid-js";
import { useData } from "vike-solid/useData";
import { TodoList } from "../../components/TodoList.jsx";

export default function Page() {
  const initialTodoItems = useData<Data>();
  return (
    <>
      <h1>To-do List</h1>
      <TodoList initialTodoItems={initialTodoItems} />
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
