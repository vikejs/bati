import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!BATI.hasD1) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env file");
  }
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./database/drizzle/schema/*",
  out: "./database/migrations",
  //# !BATI.hasD1
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
