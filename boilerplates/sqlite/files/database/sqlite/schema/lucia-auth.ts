/*{ @if (it.BATI.has("lucia-auth")) }*/
import "dotenv/config";
import { db } from "../db";

const client = db();

/**
 * SQLite Schema
 *
 * @link {@see https://lucia-auth.com/database/sqlite#schema}
 */
client.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT
)`);

client.exec(`CREATE TABLE IF NOT EXISTS oauth_accounts (
    provider_id TEXT NOT NULL,
    provider_user_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (provider_id, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE cascade ON DELETE cascade
)`);

client.exec(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE cascade ON DELETE cascade
)`);
/*{ /if }*/
