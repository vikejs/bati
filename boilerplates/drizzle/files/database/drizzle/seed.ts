import { db } from "./db";
import { todoTable } from "./schema/todos";

async function seed() {
  db()
    .insert(todoTable)
    .values([{ text: "Buy milk" }, { text: "Buy strawberries" }])
    .run();

  console.log("Seed complete!");
}

await seed();
