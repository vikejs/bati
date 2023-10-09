// https://vike.dev/onBeforeRender
import { todoItems } from "../../database/todoItems";

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
