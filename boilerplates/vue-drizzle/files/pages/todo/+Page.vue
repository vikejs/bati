<template>
  <div>
    <h1>To-do List</h1>
    <TodoList :initial-todo-items="initialTodoItems" />
  </div>
</template>

<script lang="ts" setup>
import type { Data } from "@batijs/drizzle/pages/todo/+data";
import { useData } from "vike-vue/useData";
import TodoList from "../../components/TodoList.vue";

const initialTodoItems = useData<Data>();
</script>
