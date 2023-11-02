<template>
  <div>
    <h1>To-do List</h1>
    <TodoList :todoItemsInitial="todoItemsInitial" />
  </div>
</template>

<script lang="ts" setup>
import { useAttrs } from "vue";

const { todoItemsInitial } = useAttrs();
</script>

<script lang="ts">
import TodoList from "../../components/TodoListTrpc.vue";

const components = { TodoList };
export default { components };
</script>
