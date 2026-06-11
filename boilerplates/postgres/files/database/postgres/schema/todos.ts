/*# $$.includeIfImported #*/
import "@batijs/shared-env/server/load";
import { db } from "../db";

const sql = db();

/**
 * PostgreSQL Schema
 * `todos` example
 */
await sql`CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL
)`;

await sql.end();
