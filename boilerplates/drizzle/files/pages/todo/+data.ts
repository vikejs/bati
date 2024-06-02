import { db } from "../../database/db";
import { todoTable } from "../../database/schema";

export type Data = ReturnType<typeof data>;

export default function data() {
  const todoItems = db.select().from(todoTable).all();

  return todoItems;
}
