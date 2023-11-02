import { todoItems } from "@batijs/shared-db/database/todoItems";

// https://vike.dev/onBeforeRender
export default onBeforeRender;

function onBeforeRender() {
  const initialTodoItems = todoItems;
  return {
    pageContext: {
      pageProps: {
        initialTodoItems,
      },
    },
  };
}
