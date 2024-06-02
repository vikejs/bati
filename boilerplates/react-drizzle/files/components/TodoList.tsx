import type { TodoItem } from "@batijs/drizzle/database/schema";
import { onNewTodo } from "@batijs/shared-telefunc/components/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import type { RunResult } from "better-sqlite3";
import React, { useState } from "react";

export function TodoList({ initialTodoItems }: { initialTodoItems: TodoItem[] }) {
  const [todoItems, setTodoItems] = useState(initialTodoItems);
  const [newTodo, setNewTodo] = useState("");
  return (
    <>
      <ul>
        {todoItems.map((todoItem) => (
          <li key={todoItem.id}>{todoItem.text}</li>
        ))}
        <li>
          <form
            onSubmit={async (ev) => {
              ev.preventDefault();
              if (BATI.has("telefunc")) {
                const result = await onNewTodo({ text: newTodo });
                setTodoItems((prev) => [...prev, { id: result.lastInsertRowid as number, text: newTodo }]);
                setNewTodo("");
              } else if (BATI.has("trpc")) {
                const result = await trpc.onNewTodo.mutate(newTodo);
                /*{ @if (it.BATI.has("feature")) }*/ // @ts-expect-error /*{ /if }*/
                setTodoItems((prev) => [...prev, { id: result.lastInsertRowid as number, text: newTodo }]);
                setNewTodo("");
              } else {
                try {
                  const response = await fetch("/api/todo/create", {
                    method: "POST",
                    body: JSON.stringify({ text: newTodo }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });
                  if (response.ok) {
                    const { result } = (await response.json()) as { message: string; result: RunResult };
                    setTodoItems((prev) => [...prev, { id: result.lastInsertRowid as number, text: newTodo }]);
                    setNewTodo("");
                  }
                } catch (error) {
                  console.log("error :", error);
                }
              }
            }}
          >
            <input type="text" onChange={(ev) => setNewTodo(ev.target.value)} value={newTodo} />{" "}
            <button type="submit">Add to-do</button>
          </form>
        </li>
      </ul>
    </>
  );
}
