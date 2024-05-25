import type { TodoItem } from "@batijs/drizzle/database/schema";
import { createSignal, For, untrack } from "solid-js";
import { reload } from "vike/client/router";

export function TodoList(props: { initialTodoItems: TodoItem[] }) {
  const [newTodo, setNewTodo] = createSignal("");
  return (
    <>
      <ul>
        <For each={props.initialTodoItems}>{(todoItem) => <li>{todoItem.text}</li>}</For>
        <li>
          <form
            onSubmit={async (ev) => {
              ev.preventDefault();
              try {
                const response = await fetch("/api/todo/create", {
                  method: "POST",
                  body: JSON.stringify({ text: untrack(newTodo) }),
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
            }}
          >
            <input type="text" onChange={(ev) => setNewTodo(ev.target.value)} value={newTodo()} />{" "}
            <button type="submit">Add to-do</button>
          </form>
        </li>
      </ul>
    </>
  );
}
