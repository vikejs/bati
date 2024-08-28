import { db } from "../db";
import type { Transaction } from "better-sqlite3";

export function getExistingUser(username: string) {
  return db().prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function getExistingAccount(providerId: string, providerUserId: number) {
  return db()
    .prepare("SELECT * FROM oauth_accounts WHERE provider_id = ? AND provider_user_id = ?")
    .get(providerId, providerUserId);
}

export function signupWithGithub(userId: string, username: string, githubUserId: number): Transaction {
  return db().transaction(() => {
    db().prepare("INSERT INTO users (id, username) VALUES (?, ?)").run(userId, username);
    db()
      .prepare("INSERT INTO oauth_accounts (provider_id, provider_user_id, user_id) VALUES (?, ?, ?)")
      .run("github", githubUserId, userId);
  });
}

export function signupWithCredentials(userId: string, username: string, passwordHash: string) {
  return db().prepare("INSERT INTO users (id, username, password) VALUES(?, ?, ?)").run(userId, username, passwordHash);
}
