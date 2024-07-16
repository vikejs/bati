import sqlite, { type Database } from "better-sqlite3";

export const db: Database = sqlite(":memory:");

/**
 * SQLite Schema
 *
 * @link {@see https://lucia-auth.com/database/sqlite#schema}
 */
db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS oauth_accounts (
    provider_id TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (provider_id, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
)`);

export interface DatabaseUser {
  id: string;
  username: string;
  password_hash?: string;
}
