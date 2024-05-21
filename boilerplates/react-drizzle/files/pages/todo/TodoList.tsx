import type { TodoItem } from "@batijs/drizzle/database/schema";
import React, { useState } from "react";
import { reload } from "vike/client/router";

export function TodoList({ todoItems }: { todoItems: TodoItem[] }) {
  const [newTodo, setNewTodo] = useState("");
  return (
    <>
      <ul>
        {todoItems.map((todoItem, i) => (
          <li key={i}>{todoItem.text}</li>
        ))}
        <li>
          <form
            onSubmit={async (ev) => {
              ev.preventDefault();
              try {
                const response = await fetch("/api/todo/create", {
                  method: "POST",
                  body: JSON.stringify({ text: newTodo }),
                });
                if (response.ok) {
                  await reload();
                  setNewTodo("");
                }
              } catch (error) {
                console.log("error :", error);
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
