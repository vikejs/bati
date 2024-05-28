import type { TodoItem } from "@batijs/drizzle/database/schema";
import { onCreateTodo } from "@batijs/shared-telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import React, { useState } from "react";
import { reload } from "vike/client/router";

export function TodoList({ todoItems }: { todoItems: TodoItem[] }) {
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
                await onCreateTodo({ text: newTodo });
                setNewTodo("");
                await reload();
              } else if (BATI.has("trpc")) {
                await trpc.onCreateTodo.mutate(newTodo);
                setNewTodo("");
                await reload();
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
                    await reload();
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
