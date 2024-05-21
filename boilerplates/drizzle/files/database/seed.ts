import { db } from "./db";
import { todoTable } from "./schema";

async function seed() {
  db.insert(todoTable)
    .values([{ text: "Buy milk" }, { text: "Buy strawberries" }])
    .run();

  console.log("Seed complete!");
}

seed();
