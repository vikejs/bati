import type { TodoItem } from "@batijs/shared-db/database/todoItems";
import { trpc } from "@batijs/trpc/trpc/client";
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
              /*{ @if (it.BATI.has("feature")) }*/ // @ts-expect-error /*{ /if }*/
              const { todoItems } = await trpc.onNewTodo.mutate(untrack(newTodo));
              setNewTodo("");
              setTodoItems(todoItems);
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
