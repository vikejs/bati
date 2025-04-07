import type { Data } from "@batijs/shared-todo/pages/todo/+data";
import { useData } from "vike-react/useData";
import { TodoList } from "./TodoList.js";

export default function Page() {
  const data = useData<Data>();
  return (
    <>
      <h1>To-do List</h1>
      <TodoList initialTodoItems={data.todo} />
    </>
  );
}
