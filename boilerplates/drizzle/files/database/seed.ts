import { drizzleDb } from "./drizzleDb";
import { todoTable } from "./schema/todos";

async function seed() {
  drizzleDb
    .insert(todoTable)
    .values([{ text: "Buy milk" }, { text: "Buy strawberries" }])
    .run();

  console.log("Seed complete!");
}

seed();
