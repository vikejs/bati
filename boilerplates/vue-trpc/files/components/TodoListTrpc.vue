<template>
  <ul>
    <li
      v-for="item in todoItems"
      :key="item.text"
    >
      {{ item.text }}
    </li>
    <li>
      <form @submit.prevent="submitDraft()">
        <input
          v-model="draft"
          type="text"
        >{{ " " }}
        <button type="submit">
          Add to-do
        </button>
      </form>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref, useAttrs } from "vue";
import { trpc } from "@batijs/trpc/trpc/client";

const { todoItemsInitial } = useAttrs();

const todoItems = ref(todoItemsInitial);
const draft = ref("");

const submitDraft = async () => {
  const result = await trpc.onNewTodo.mutate(draft.value);
  draft.value = "";
  todoItems.value = result.todoItems;
};
</script>
