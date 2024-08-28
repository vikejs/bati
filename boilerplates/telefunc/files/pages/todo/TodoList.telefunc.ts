import { insertTodo } from "@batijs/drizzle/database/drizzle/queries/todos";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await insertTodo(text);
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", { text });
  }
}
