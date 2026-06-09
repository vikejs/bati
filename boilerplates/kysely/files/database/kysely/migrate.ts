/*{ @if (!it.BATI.hasD1) }*/

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { dbKysely, dbKyselyPostgres } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateToLatest() {
  const db = BATI.has("postgres") ? dbKyselyPostgres() : dbKysely();
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // Absolute path required. The runner sits two levels deep in both dev (database/kysely/)
      // and prod (bundled dist/server/), so ../.. reaches the app-root migration sources.
      migrationFolder: path.join(__dirname, "../../database/kysely/migrations"),
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

  await db.destroy();
}

await migrateToLatest();
/*{ /if }*/
