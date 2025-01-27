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
import { css } from "../../styled-system/css";

const inputClass = ref(
  BATI.has("tailwindcss")
    ? "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto p-2 mr-1 mb-1"
    : BATI.has("panda-css")
      ? css({
          p: 2,
          bg: "gray.50",
          borderWidth: 1,
          borderColor: "gray.300",
          color: "gray.900",
          fontSize: "sm",
          rounded: "md",
          width: { base: "full", sm: "auto" },
          _focus: { ringColor: "teal.500", borderColor: "teal.500" },
          mr: 1,
          mb: 1,
        })
      : "",
);
const buttonClass = ref(
  BATI.has("tailwindcss")
    ? "text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-hidden focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto p-2"
    : BATI.has("panda-css")
      ? css({
          color: "white",
          bg: { base: "teal.700", _hover: "teal.800" },
          _focus: {
            ringWidth: 2,
            ringColor: "teal.300",
            outline: "1px solid transparent",
            outlineOffset: "1px",
          },
          cursor: "pointer",
          fontSize: "sm",
          fontWeight: 500,
          rounded: "md",
          width: { base: "full", sm: "auto" },
          p: 2,
        })
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
