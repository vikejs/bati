/*# BATI include-if-imported #*/
import { dbD1, dbSqlite } from "../db";
import { oauthAccountTable, userTable } from "../schema/lucia-auth";
import { and, eq } from "drizzle-orm";

export async function getExistingUser(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
  username: string,
) {
  return db.select().from(userTable).where(eq(userTable.username, username)).get();
}

export async function getExistingAccount(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
  providerId: string,
  providerUserId: number,
) {
  return db
    .select()
    .from(oauthAccountTable)
    .where(and(eq(oauthAccountTable.providerId, providerId), eq(oauthAccountTable.providerUserId, providerUserId)))
    .get();
}

export async function signupWithGithub(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
  userId: string,
  username: string,
  githubUserId: number,
) {
  return db.transaction(async (tx) => {
    await tx.insert(userTable).values({ id: userId, username: username });
    await tx.insert(oauthAccountTable).values({ providerId: "github", providerUserId: githubUserId, userId });
  });
}

export async function signupWithCredentials(
  db: BATI.If<{
    "!BATI.hasD1": ReturnType<typeof dbSqlite>;
    _: ReturnType<typeof dbD1>;
  }>,
  userId: string,
  username: string,
  passwordHash: string,
) {
  return db.insert(userTable).values({ id: userId, username, password: passwordHash }).run();
}
