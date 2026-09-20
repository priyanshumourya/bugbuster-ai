import Fastify from "fastify";
import { closePool } from "@bugbuster/db";
import { logger } from "./config/index.js";
import { closeQueue } from "./jobs/queue.js";
import { closeRedis } from "./redis/client.js";
import { healthRoutes } from "./routes/health.js";
import { jobRoutes } from "./routes/jobs.js";

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
  });

  await app.register(healthRoutes);
  await app.register(jobRoutes, { prefix: "/api/v1" });

  return app;
}

export async function closeAppResources(): Promise<void> {
  await closeQueue();
  await closeRedis();
  await closePool();
}
