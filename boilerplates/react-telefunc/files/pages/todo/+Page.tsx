import type { TodoItem } from "@batijs/shared-db/database/todoItems";
import React, { useState } from "react";
import { TodoList } from "./TodoList";

export default function Page({ todoItemsInitial }: { todoItemsInitial: TodoItem[] }) {
  return (
    <>
      <h1>To-do List</h1>
      <TodoList todoItemsInitial={todoItemsInitial} />
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
