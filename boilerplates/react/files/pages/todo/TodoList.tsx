import { onNewTodo } from "@batijs/telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import { client } from "@batijs/ts-rest/ts-rest/client";
import { useState } from "react";

export function TodoList({ initialTodoItems }: { initialTodoItems: { text: string }[] }) {
  const [todoItems, setTodoItems] = useState(initialTodoItems);
  const [newTodo, setNewTodo] = useState("");
  return (
    <>
      <ul>
        {todoItems.map((todoItem, index) => (
          // biome-ignore lint: example
          <li key={index}>{todoItem.text}</li>
        ))}
      </ul>
      <div>
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();

            setTodoItems((prev) => [...prev, { text: newTodo }]);
            setNewTodo("");
            if (BATI.hasServer) {
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
            }
          }}
        >
          <input
            type="text"
            onChange={(ev) => setNewTodo(ev.target.value)}
            value={newTodo}
            //# BATI.has("tailwindcss")
            className={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
          <button
            type="submit"
            //# BATI.has("tailwindcss")
            className={
              "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
            }
          >
            Add to-do
          </button>
        </form>
      </div>
    </>
  );
}
