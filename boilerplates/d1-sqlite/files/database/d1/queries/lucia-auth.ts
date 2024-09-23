/*# BATI include-if-imported #*/
import type { D1Database } from "@cloudflare/workers-types";

export function getExistingUser<T>(db: D1Database, username: string) {
  return db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first<T>();
}

export function getExistingAccount<T>(db: D1Database, providerId: string, providerUserId: number) {
  return db
    .prepare("SELECT * FROM oauth_accounts WHERE provider_id = ? AND provider_user_id = ?")
    .bind(providerId, providerUserId)
    .first<T>();
}

export function signupWithGithub(db: D1Database, userId: string, username: string, githubUserId: number) {
  return db.batch([
    db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").bind(userId, username),
    db
      .prepare("INSERT INTO oauth_accounts (provider_id, provider_user_id, user_id) VALUES (?, ?, ?)")
      .bind("github", githubUserId, userId),
  ]);
}

export function signupWithCredentials(db: D1Database, userId: string, username: string, passwordHash: string) {
  return db
    .prepare("INSERT INTO users (id, username, password) VALUES(?, ?, ?)")
    .bind(userId, username, passwordHash)
    .run();
}
