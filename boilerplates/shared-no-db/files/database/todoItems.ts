import type { LowSync } from "lowdb";
import { JSONFileSyncPreset } from "lowdb/node";

interface TodoItem {
  text: string;
}

const lowDb: LowSync<{ todo: TodoItem[] }> = JSONFileSyncPreset<{ todo: TodoItem[] }>("db.json", {
  todo: [{ text: "Buy milk" }, { text: "Buy strawberries" }],
});

export { lowDb };
export type { TodoItem };
