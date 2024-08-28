/*# BATI include-if-imported #*/
import { db } from "../db";

const client = db();

/**
 * SQLite Schema
 * `todos` example
 */
client.exec(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER NOT NULL PRIMARY KEY,
    text TEXT
)`);
