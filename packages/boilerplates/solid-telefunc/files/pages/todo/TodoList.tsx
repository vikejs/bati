import { createSignal, For, untrack } from "solid-js";
import type { TodoItem } from "../../database/todoItems.js";
import { onNewTodo } from "./TodoList.telefunc.js";

export function TodoList(props: { todoItemsInitial: TodoItem[] }) {
  const [todoItems, setTodoItems] = createSignal(props.todoItemsInitial);
  const [draft, setDraft] = createSignal("");
  return (
    <>
      <ul>
        <For each={todoItems()}>{(todoItem) => <li>{todoItem.text}</li>}</For>
        <li>
          <form
            onSubmit={async (ev) => {
              ev.preventDefault();
              const { todoItems } = await onNewTodo({ text: untrack(draft) });
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
