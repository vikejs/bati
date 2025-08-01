<template>
  <ul>
    <li v-for="(item, index) in todoItems" :key="index">
      {{ item.text }}
    </li>
    <li>
      <form @submit.prevent="submitNewTodo()">
        <input v-model="newTodo" type="text" :class="[inputClass]" />
        <button type="submit" :class="[buttonClass]">Add to-do</button>
      </form>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onNewTodo } from "@batijs/telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import { client } from "@batijs/ts-rest/ts-rest/client";
import { ref } from "vue";

const inputClass = ref(
  BATI.has("tailwindcss")
    ? "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
    : "",
);
const buttonClass = ref(
  BATI.has("tailwindcss")
    ? "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
    : "",
);

const props = defineProps<{ initialTodoItems: { text: string }[] }>();
const todoItems = ref(props.initialTodoItems);
const newTodo = ref("");

const submitNewTodo = async () => {
  // Optimistic UI update
  todoItems.value.push({ text: newTodo.value });
  if (BATI.hasServer) {
    try {
      if (BATI.has("telefunc")) {
        await onNewTodo({ text: newTodo.value });
      } else if (BATI.has("trpc")) {
        await trpc.onNewTodo.mutate(newTodo.value);
      } else if (BATI.has("ts-rest")) {
        await client.createTodo({ body: { text: newTodo.value } });
      } else {
        const response = await fetch("/api/todo/create", {
          method: "POST",
          body: JSON.stringify({ text: newTodo.value }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        await response.blob();
      }
      newTodo.value = "";
    } catch (e) {
      console.error(e);
      // rollback
      todoItems.value.slice(0, -1);
    }
  }
};
</script>
