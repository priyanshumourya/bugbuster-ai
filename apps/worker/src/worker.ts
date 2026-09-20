import { Worker } from "bullmq";
import { createLogger, getRedisConnectionOptions } from "@bugbuster/config";
import { closePool } from "@bugbuster/db";
import { QUEUE_NAME, type QueueJobPayload } from "@bugbuster/types";
import { processJob } from "./processors/jobProcessor.js";

const logger = createLogger("worker");

const worker = new Worker<QueueJobPayload>(QUEUE_NAME, processJob, {
  connection: getRedisConnectionOptions(),
  concurrency: 1,
});

worker.on("ready", () => {
  logger.info({ queue: QUEUE_NAME }, "worker listening");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.data.jobId, err: error }, "queue job failed");
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "shutting down worker");
  try {
    await worker.close();
    await closePool();
  } catch (error) {
    logger.error({ err: error }, "error during worker shutdown");
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
