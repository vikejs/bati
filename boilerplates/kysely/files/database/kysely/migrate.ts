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
      // This needs to be an absolute path. Both runners sit two levels below the app root
      // — database/kysely/migrate.ts in dev, the bundled dist/server/migrate.mjs in prod — so
      // this resolves to the app-root migration sources, shipped as-is into the runtime image.
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
