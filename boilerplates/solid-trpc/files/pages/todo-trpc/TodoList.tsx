import type { TodoItem } from "bati:../../database/todoItems";
import { trpc } from "bati:../../trpc/client";
import { createSignal, For, untrack } from "solid-js";

export function TodoList(props: { initialTodoItems: TodoItem[] }) {
  const [todoItems, setTodoItems] = createSignal(props.initialTodoItems);
  const [draft, setDraft] = createSignal("");
  return (
    <>
      <ul>
        <For each={todoItems()}>{(todoItem) => <li>{todoItem.text}</li>}</For>
        <li>
          <form
            onSubmit={async (ev) => {
              ev.preventDefault();
              const { todoItems } = await trpc.onNewTodo.mutate(untrack(draft));
              setDraft("");
              setTodoItems(todoItems);
            }}
          >
            <input type="text" onChange={(ev) => setDraft(ev.target.value)} value={draft()} />{" "}
            <button type="submit">Add to-do</button>
          </form>
        </li>
      </ul>
    </>
  );
}
