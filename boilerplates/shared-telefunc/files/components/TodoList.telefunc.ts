import { db } from "@batijs/drizzle/database/db";
import { todoTable, type TodoInsert } from "@batijs/drizzle/database/schema";
import type { RunResult } from "better-sqlite3";

export async function onNewTodo({ text }: TodoInsert) {
  const result: RunResult = await db.insert(todoTable).values({ text });

  return result;
}
