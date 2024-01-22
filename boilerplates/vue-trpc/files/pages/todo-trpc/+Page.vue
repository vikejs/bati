<template>
  <div>
    <h1>To-do List</h1>
    <TodoList :todo-items-initial="todoItemsInitial" />
  </div>
</template>

<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import type { Data } from "./+data";

const todoItemsInitial = useData<Data>();
</script>

<script lang="ts">
import TodoList from "../../components/TodoListTrpc.vue";

const components = { TodoList };
export default { components };
</script>
