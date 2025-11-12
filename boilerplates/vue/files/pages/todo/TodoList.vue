<template>
  <ul>
    <li v-for="(item, index) in todoItems" :key="index">
      {{ item.text }}
    </li>
    <li>
      <form @submit.prevent="submitNewTodo()">
        <!-- BATI.has("tailwindcss") -->
        <input v-model="newTodo" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1" />
        <!-- !BATI.has("tailwindcss") -->
        <input v-model="newTodo" type="text" />
        <!-- BATI.has("tailwindcss") -->
        <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2">Add to-do</button>
        <!-- !BATI.has("tailwindcss") -->
        <button type="submit">Add to-do</button>
      </form>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Data } from "@batijs/shared-todo/pages/todo/+data";
import { onNewTodo } from "@batijs/telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import { client } from "@batijs/ts-rest/ts-rest/client";
import { useData } from "vike-vue/useData";
import { ref } from "vue";

const { todoItemsInitial } = useData<Data>();
const todoItems = ref<{ text: string }[]>(todoItemsInitial);
const newTodo = ref("");

const submitNewTodo = async () => {
  const text = newTodo.value;
  todoItems.value.push({ text });
  newTodo.value = "";
  if (BATI.hasServer) {
    if (BATI.has("telefunc")) {
      await onNewTodo({ text });
    } else if (BATI.has("trpc")) {
      await trpc.onNewTodo.mutate(text);
    } else if (BATI.has("ts-rest")) {
      await client.createTodo({ body: { text } });
    } else {
      const response = await fetch("/api/todo/create", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      await response.blob();
    }
  }
};
</script>
