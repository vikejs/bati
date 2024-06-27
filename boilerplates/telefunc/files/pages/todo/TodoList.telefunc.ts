import { db } from "@batijs/drizzle/database/db";
import { todoTable } from "@batijs/drizzle/database/schema";

export async function onNewTodo({ text }: { text: string }) {
  if (BATI.has("drizzle")) {
    await db.insert(todoTable).values({ text });
  } else {
    // This is where you'd persist the data
    console.log("Received new todo", { text });
  }
}
