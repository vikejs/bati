// https://vike.dev/onBeforeRender
import { todoItems } from "@batijs/shared-db/database/todoItems";

export default function onBeforeRender() {
  const todoItemsInitial = todoItems;
  return {
    pageContext: {
      pageProps: {
        todoItemsInitial,
      },
    },
  };
}
