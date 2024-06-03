import type { Data } from "@batijs/shared-todo/pages/todo/+data";
import React, { useState } from "react";
import { useData } from "vike-react/useData";
import { TodoList } from "./TodoList.js";

export default function Page() {
  const todoItemsInitial = useData<Data>();
  return (
    <>
      <h1>To-do List</h1>
      <TodoList initialTodoItems={todoItemsInitial} />
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
