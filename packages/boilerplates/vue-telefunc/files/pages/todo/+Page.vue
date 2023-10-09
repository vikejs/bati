<template>
  <div>
    <h1>To-do List</h1>
    <TodoList :todo-items-initial="todoItemsInitial" />
    <Counter />
  </div>
</template>

<script lang="ts" setup>
import { useAttrs } from "vue";

const { todoItemsInitial } = useAttrs();
</script>

<script lang="ts">
import Counter from "../../components/Counter.vue";
import TodoList from "../../components/TodoList.vue";
const components = { Counter, TodoList };
export default { components };
</script>
