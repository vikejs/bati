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
import { trpc } from "@batijs/trpc/trpc/client";
import { ref, useAttrs, type Ref } from "vue";

type TodoItem = { text: string };

const attrs = useAttrs();

const todoItems = ref(attrs["todo-items-initial"]) as Ref<TodoItem[]>;
const newTodo = ref("");

const submitNewTodo = async () => {
  const result = await trpc.onNewTodo.mutate(newTodo.value);
  newTodo.value = "";
  /*{ @if (it.BATI.has("feature")) }*/ // @ts-expect-error /*{ /if }*/
  todoItems.value = result.todoItems;
};
</script>
