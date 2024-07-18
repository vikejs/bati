import { drizzleDb } from "@batijs/drizzle/database/drizzleDb";
import { sqliteDb } from "./sqliteDb";
import { userTable, oauthAccountTable } from "./schema/auth";
import { eq, and } from "drizzle-orm";

export function getExistingUser(username: string) {
  if (BATI.has("drizzle")) {
    return drizzleDb.select().from(userTable).where(eq(userTable.username, username)).get();
  }
  return sqliteDb.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function getExistingAccount(providerId: string, providerUserId: string) {
  if (BATI.has("drizzle")) {
    return drizzleDb
      .select()
      .from(oauthAccountTable)
      .where(and(eq(oauthAccountTable.providerId, providerId), eq(oauthAccountTable.providerUserId, providerUserId)))
      .get();
  }
  return sqliteDb
    .prepare("SELECT * FROM oauth_accounts WHERE provider_id = ? AND provider_user_id = ?")
    .get(providerId, providerUserId);
}
