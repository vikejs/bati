import { onNewTodo } from "@batijs/telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import { client } from "@batijs/ts-rest/ts-rest/client";
import React, { useState } from "react";

export function TodoList({ initialTodoItems }: { initialTodoItems: { text: string }[] }) {
  const [todoItems, setTodoItems] = useState(initialTodoItems);
  const [newTodo, setNewTodo] = useState("");
  return (
    <>
      <ul>
        {todoItems.map((todoItem, index) => (
          // biome-ignore lint:
          <li key={index}>{todoItem.text}</li>
        ))}
      </ul>
      <div>
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();

            // Optimistic UI update
            setTodoItems((prev) => [...prev, { text: newTodo }]);
            if (BATI.hasServer) {
              try {
                if (BATI.has("telefunc")) {
                  await onNewTodo({ text: newTodo });
                } else if (BATI.has("trpc")) {
                  await trpc.onNewTodo.mutate(newTodo);
                } else if (BATI.has("ts-rest")) {
                  await client.createTodo({ body: { text: newTodo } });
                } else {
                  const response = await fetch("/api/todo/create", {
                    method: "POST",
                    body: JSON.stringify({ text: newTodo }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });
                  await response.blob();
                }
                setNewTodo("");
              } catch (e) {
                console.error(e);
                // rollback
                setTodoItems((prev) => prev.slice(0, -1));
              }
            }
          }}
        >
          <input type="text" onChange={(ev) => setNewTodo(ev.target.value)} value={newTodo} />{" "}
          <button type="submit">Add to-do</button>
        </form>
      </div>
    </>
  );
}
