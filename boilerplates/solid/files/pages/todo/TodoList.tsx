import { onNewTodo } from "@batijs/telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import { client } from "@batijs/ts-rest/ts-rest/client";
import { createSignal, For, untrack } from "solid-js";
import { css } from "../../styled-system/css";

export function TodoList(props: { initialTodoItems: { text: string }[] }) {
  const [todoItems, setTodoItems] = createSignal(props.initialTodoItems);
  const [newTodo, setNewTodo] = createSignal("");
  return (
    <>
      <ul>
        <For each={todoItems()}>{(todoItem) => <li>{todoItem.text}</li>}</For>
      </ul>
      <div>
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();

            // Optimistic UI update
            setTodoItems((prev) => [...prev, { text: untrack(newTodo) }]);
            if (BATI.hasServer) {
              try {
                if (BATI.has("telefunc")) {
                  await onNewTodo({ text: untrack(newTodo) });
                } else if (BATI.has("trpc")) {
                  await trpc.onNewTodo.mutate(untrack(newTodo));
                } else if (BATI.has("ts-rest")) {
                  await client.createTodo({ body: { text: untrack(newTodo) } });
                } else {
                  const response = await fetch("/api/todo/create", {
                    method: "POST",
                    body: JSON.stringify({ text: untrack(newTodo) }),
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
          <input
            type="text"
            onChange={(ev) => setNewTodo(ev.target.value)}
            value={newTodo()}
            //# BATI.has("tailwindcss") || BATI.has("panda-css")
            class={
              BATI.has("tailwindcss")
                ? "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
                : css({
                    p: 2,
                    bg: "gray.50",
                    borderWidth: 1,
                    borderColor: "gray.300",
                    color: "gray.900",
                    fontSize: "sm",
                    rounded: "md",
                    width: { base: "full", sm: "auto" },
                    _focus: { ringColor: "teal.500", borderColor: "teal.500" },
                    mr: 1,
                    mb: 1,
                  })
            }
          />
          <button
            type="submit"
            //# BATI.has("tailwindcss") || BATI.has("panda-css")
            class={
              BATI.has("tailwindcss")
                ? "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
                : css({
                    color: "white",
                    bg: { base: "teal.700", _hover: "teal.800" },
                    _focus: {
                      ringWidth: 2,
                      ringColor: "teal.300",
                      outline: "1px solid transparent",
                      outlineOffset: "1px",
                    },
                    cursor: "pointer",
                    fontSize: "sm",
                    fontWeight: 500,
                    rounded: "md",
                    width: { base: "full", sm: "auto" },
                    p: 2,
                  })
            }
          >
            Add to-do
          </button>
        </form>
      </div>
    </>
  );
}
