/*{ @if (!it.BATI.hasD1) }*/
import type { Kysely } from "kysely";
import type { Database } from "../types";

export async function up(db: Kysely<Database>): Promise<void> {
  const withId = BATI.has("postgres")
    ? db.schema.createTable("todos").addColumn("id", "serial", (col) => col.primaryKey())
    : db.schema.createTable("todos").addColumn("id", "integer", (col) => col.primaryKey().autoIncrement());
  await withId.addColumn("text", "text", (col) => col.notNull()).execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("todos").execute();
}
/*{ /if }*/
