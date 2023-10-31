// https://vike.dev/onBeforeRender
export default onBeforeRender;

import { todoItems } from "../../database/todoItems";

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
