<template>
  <ul>
    <li v-for="item in todoItems" :key="item.text">
      {{ item.text }}
    </li>
    <li>
      <form @submit.prevent="submitNewTodo()">
        <input v-model="newTodo" type="text" />{{ " " }}
        <button type="submit">Add to-do</button>
      </form>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onNewTodo } from "@batijs/telefunc/pages/todo/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import { client } from "@batijs/ts-rest/ts-rest/client";
import { ref } from "vue";

const props = defineProps<{ initialTodoItems: { text: string }[] }>();
const todoItems = ref(props.initialTodoItems);
const newTodo = ref("");

const submitNewTodo = async () => {
  // Optimistic UI update
  todoItems.value.push({ text: newTodo.value });
  if (BATI.has("express") || BATI.has("fastify") || BATI.has("h3") || BATI.has("hattip") || BATI.has("hono")) {
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
