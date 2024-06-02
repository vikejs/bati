import type { TodoItem } from "@batijs/drizzle/database/schema";
import { onNewTodo } from "@batijs/shared-telefunc/components/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import type { RunResult } from "better-sqlite3";
import { createSignal, For, untrack } from "solid-js";

export function TodoList(props: { initialTodoItems: TodoItem[] }) {
  const [todoItems, setTodoItems] = createSignal(props.initialTodoItems);
  const [newTodo, setNewTodo] = createSignal("");
  return (
    <>
      <ul>
        <For each={todoItems()}>{(todoItem) => <li>{todoItem.text}</li>}</For>
        <li>
          <form
            onSubmit={async (ev) => {
              ev.preventDefault();
              if (BATI.has("telefunc")) {
                const result = await onNewTodo({ text: untrack(newTodo) });
                setTodoItems((prev) => [
                  ...prev,
                  ...[{ id: result.lastInsertRowid as number, text: untrack(newTodo) }],
                ]);
                setNewTodo("");
              } else if (BATI.has("trpc")) {
                const result = await trpc.onNewTodo.mutate(untrack(newTodo));
                setTodoItems((prev) => [
                  ...prev,
                  /*{ @if (it.BATI.has("feature")) }*/ // @ts-expect-error /*{ /if }*/
                  ...[{ id: result.lastInsertRowid as number, text: untrack(newTodo) }],
                ]);
                setNewTodo("");
              } else {
                try {
                  const response = await fetch("/api/todo/create", {
                    method: "POST",
                    body: JSON.stringify({ text: untrack(newTodo) }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });
                  if (response.ok) {
                    const { result } = (await response.json()) as { message: string; result: RunResult };
                    setTodoItems((prev) => [
                      ...prev,
                      ...[{ id: result.lastInsertRowid as number, text: untrack(newTodo) }],
                    ]);
                    setNewTodo("");
                  }
                } catch (error) {
                  console.log("error :", error);
                }
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
