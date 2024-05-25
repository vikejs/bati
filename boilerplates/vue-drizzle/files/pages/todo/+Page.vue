<template>
  <div>
    <h1>To-do List</h1>
    <TodoList :todo-items="todoItems" />
  </div>
</template>

<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import type { Data } from "./+data.js";
import TodoList from "../../components/TodoList.vue";

const todoItems = useData<Data>();
</script>
