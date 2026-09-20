import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLogger } from "@bugbuster/config";
import { getPool } from "./pool.js";

function findMigrationsDir(): string {
  if (process.env.MIGRATIONS_DIR) {
    return process.env.MIGRATIONS_DIR;
  }
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = resolve(dir, "database", "migrations");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error("Could not find database/migrations");
}

export async function migrate(): Promise<void> {
  const logger = createLogger("migrate");
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const migrationsDir = findMigrationsDir();
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const applied = await pool.query(`SELECT 1 FROM schema_migrations WHERE id = $1`, [file]);
    if ((applied.rowCount ?? 0) > 0) {
      logger.info({ file }, "migration already applied");
      continue;
    }

    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      logger.info({ file }, "applied migration");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
