import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./database/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: "sqlite.db",
  },
});
