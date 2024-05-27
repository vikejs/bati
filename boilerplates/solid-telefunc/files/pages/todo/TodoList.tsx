import type { TodoItem } from "@batijs/shared-db/database/todoItems";
import { createSignal, For, untrack } from "solid-js";
import { onNewTodo } from "./TodoList.telefunc.js";

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
              const { todoItems } = await onNewTodo({ text: untrack(newTodo) });
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
