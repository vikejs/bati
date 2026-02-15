import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { createTodo, fetchTodos, type TodoItem } from "../../services/api";

export function TodoList() {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState("");

  const { data: todoItems = [] } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData<TodoItem[]>(["todos"]);
      queryClient.setQueryData<TodoItem[]>(["todos"], (old = []) => [...old, { text }]);
      return { previousTodos };
    },
    onError: (_err, _text, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

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
          onSubmit={(ev) => {
            ev.preventDefault();
            if (newTodo.trim()) {
              createMutation.mutate(newTodo);
              setNewTodo("");
            }
          }}
        >
          <input
            type="text"
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setNewTodo(ev.currentTarget.value)}
            value={newTodo}
            //# BATI.has("tailwindcss")
            className={
              "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
            }
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            //# BATI.has("tailwindcss")
            className={
              "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2 disabled:opacity-50"
            }
          >
            {createMutation.isPending ? "Adding..." : "Add to-do"}
          </button>
        </form>
      </div>
    </>
  );
}
