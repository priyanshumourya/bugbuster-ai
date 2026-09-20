import { closePool, migrate as runMigrations } from "@bugbuster/db";

try {
  await runMigrations();
} finally {
  await closePool();
}
