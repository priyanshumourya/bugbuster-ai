import pg from "pg";
import { getEnv } from "@bugbuster/config";

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getEnv().DATABASE_URL,
    });
  }
  return pool;
}

export async function checkDatabase(): Promise<void> {
  await getPool().query("SELECT 1");
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
