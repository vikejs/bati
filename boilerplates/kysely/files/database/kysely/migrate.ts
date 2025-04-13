import * as path from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { promises as fs } from "fs";
import { Migrator, FileMigrationProvider } from "kysely";
import { dbKysely } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateToLatest() {
  const migrator = new Migrator({
    db: dbKysely,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, "migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await dbKysely.destroy();
}

migrateToLatest();
