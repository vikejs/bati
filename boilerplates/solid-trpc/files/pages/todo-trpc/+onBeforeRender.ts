import { todoItems } from "@batijs/trpc/database/todoItems";

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
