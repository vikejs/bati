<template>
  <ul>
    <li v-for="item in todoItems">{{ item.text }}</li>
    <li>
      <form @submit.prevent="submitDraft()">
        <input type="text" v-model="draft" />{{ " " }}
        <button type="submit">Add to-do</button>
      </form>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onNewTodo } from "./TodoList.telefunc.js";
import { ref, useAttrs } from 'vue';
const { todoItemsInitial } = useAttrs();

const todoItems = ref(todoItemsInitial);
const draft = ref("");

const submitDraft = async () => {
  const result = await onNewTodo({
    text: draft.value,
  });
  draft.value = "";
  todoItems.value = result.todoItems;
};
</script>
