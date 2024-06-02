import type { Data } from "@batijs/drizzle/pages/todo/+data";
import React, { useState } from "react";
import { useData } from "vike-react/useData";
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
  const [count, setCount] = useState(0);
  return (
    <div>
      This page is interactive:
      <button type="button" onClick={() => setCount((count) => count + 1)}>
        Counter {count}
      </button>
    </div>
  );
}
