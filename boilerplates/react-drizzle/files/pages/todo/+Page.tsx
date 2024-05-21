import React, { useState } from "react";
import { useData } from "vike-react/useData";
import type { Data } from "./+data.js";
import { TodoList } from "./TodoList.jsx";

export default function Page() {
  const todoItems = useData<Data>();
  return (
    <>
      <h1>To-do List</h1>
      <TodoList todoItems={todoItems} />
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
