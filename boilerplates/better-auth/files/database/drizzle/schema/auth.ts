/*# BATI include-if-imported #*/
import { boolean, pgTable, text as pgText, timestamp } from "drizzle-orm/pg-core";
import { integer, sqliteTable, text as sqliteText } from "drizzle-orm/sqlite-core";

// Better Auth's tables, owned by Drizzle so its migrations create them.
// Regenerate with `npx @better-auth/cli generate` if you customize the Better Auth config.
// Column names are snake_case to match Better Auth's Drizzle adapter defaults.

export const user = BATI.has("postgres")
  ? pgTable("user", {
      id: pgText("id").primaryKey(),
      name: pgText("name").notNull(),
      email: pgText("email").notNull().unique(),
      emailVerified: boolean("email_verified").notNull(),
      image: pgText("image"),
      createdAt: timestamp("created_at").notNull(),
      updatedAt: timestamp("updated_at").notNull(),
    })
  : sqliteTable("user", {
      id: sqliteText("id").primaryKey(),
      name: sqliteText("name").notNull(),
      email: sqliteText("email").notNull().unique(),
      emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
      image: sqliteText("image"),
      createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
      updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    });

export const session = BATI.has("postgres")
  ? pgTable("session", {
      id: pgText("id").primaryKey(),
      expiresAt: timestamp("expires_at").notNull(),
      token: pgText("token").notNull().unique(),
      createdAt: timestamp("created_at").notNull(),
      updatedAt: timestamp("updated_at").notNull(),
      ipAddress: pgText("ip_address"),
      userAgent: pgText("user_agent"),
      userId: pgText("user_id").notNull(),
    })
  : sqliteTable("session", {
      id: sqliteText("id").primaryKey(),
      expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
      token: sqliteText("token").notNull().unique(),
      createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
      updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
      ipAddress: sqliteText("ip_address"),
      userAgent: sqliteText("user_agent"),
      userId: sqliteText("user_id").notNull(),
    });

export const account = BATI.has("postgres")
  ? pgTable("account", {
      id: pgText("id").primaryKey(),
      accountId: pgText("account_id").notNull(),
      providerId: pgText("provider_id").notNull(),
      userId: pgText("user_id").notNull(),
      accessToken: pgText("access_token"),
      refreshToken: pgText("refresh_token"),
      idToken: pgText("id_token"),
      accessTokenExpiresAt: timestamp("access_token_expires_at"),
      refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
      scope: pgText("scope"),
      password: pgText("password"),
      createdAt: timestamp("created_at").notNull(),
      updatedAt: timestamp("updated_at").notNull(),
    })
  : sqliteTable("account", {
      id: sqliteText("id").primaryKey(),
      accountId: sqliteText("account_id").notNull(),
      providerId: sqliteText("provider_id").notNull(),
      userId: sqliteText("user_id").notNull(),
      accessToken: sqliteText("access_token"),
      refreshToken: sqliteText("refresh_token"),
      idToken: sqliteText("id_token"),
      accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
      refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
      scope: sqliteText("scope"),
      password: sqliteText("password"),
      createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
      updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    });

export const verification = BATI.has("postgres")
  ? pgTable("verification", {
      id: pgText("id").primaryKey(),
      identifier: pgText("identifier").notNull(),
      value: pgText("value").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").notNull(),
      updatedAt: timestamp("updated_at").notNull(),
    })
  : sqliteTable("verification", {
      id: sqliteText("id").primaryKey(),
      identifier: sqliteText("identifier").notNull(),
      value: sqliteText("value").notNull(),
      expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
      createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
      updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    });
