/*# BATI include-if-imported #*/
import { db } from "../db";
import { oauthAccountTable, userTable } from "../schema/lucia-auth";
import { and, eq } from "drizzle-orm";

export function getExistingUser(username: string) {
  return db().select().from(userTable).where(eq(userTable.username, username)).get();
}

export function getExistingAccount(providerId: string, providerUserId: number) {
  return db()
    .select()
    .from(oauthAccountTable)
    .where(and(eq(oauthAccountTable.providerId, providerId), eq(oauthAccountTable.providerUserId, providerUserId)))
    .get();
}

export function signupWithGithub(userId: string, username: string, githubUserId: number) {
  return db().transaction(async (tx) => {
    await tx.insert(userTable).values({ id: userId, username: username });
    await tx.insert(oauthAccountTable).values({ providerId: "github", providerUserId: githubUserId, userId });
  });
}

export function signupWithCredentials(userId: string, username: string, passwordHash: string) {
  return db().insert(userTable).values({ id: userId, username, password: passwordHash }).run();
}
