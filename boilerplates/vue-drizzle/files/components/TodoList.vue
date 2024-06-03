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
import { ref, defineProps } from "vue";
import type { TodoItem } from "@batijs/drizzle/database/schema";
import { onNewTodo } from "@batijs/shared-telefunc/components/TodoList.telefunc";
import { trpc } from "@batijs/trpc/trpc/client";
import type { RunResult } from "better-sqlite3";

const props = defineProps<{initialTodoItems: TodoItem[]}>()
const todoItems = ref(props.initialTodoItems);
const newTodo = ref("");

const submitNewTodo = async () => {
  if (BATI.has("telefunc")) {
    const result = await onNewTodo({ text: newTodo.value });
    todoItems.value.push({ id: result.lastInsertRowid as number, text: newTodo.value })
    newTodo.value = "";
  } else if (BATI.has("trpc")) {
    const result = await trpc.onNewTodo.mutate(newTodo.value);
    /*{ @if (it.BATI.has("feature")) }*/ // @ts-expect-error /*{ /if }*/
    todoItems.value.push({ id: result.lastInsertRowid as number, text: newTodo.value })
    newTodo.value = "";
  } else {
    try {
      const response = await fetch("/api/todo/create", {
        method: "POST",
        body: JSON.stringify({ text: newTodo.value }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const { result } = await response.json() as { message: string, result: RunResult }
        todoItems.value.push({ id: result.lastInsertRowid as number, text: newTodo.value })
        newTodo.value = "";
      }
    } catch (error) {
      console.log("error :", error);
    }
  }
};
</script>
