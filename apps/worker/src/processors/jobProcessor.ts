import type { Job } from "bullmq";
import { JobStatus, type QueueJobPayload } from "@bugbuster/types";
import { createLogger } from "@bugbuster/config";
import { getJobById, markJobFailed, updateJobStatus } from "@bugbuster/db";

const logger = createLogger("worker");
const ANALYZE_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function processJob(job: Job<QueueJobPayload>): Promise<void> {
  const jobId = job.data.jobId;
  const log = logger.child({ jobId, bullmqId: job.id });

  const existing = await getJobById(jobId);
  if (!existing) {
    throw new Error(`Job ${jobId} not found in database`);
  }

  try {
    log.info("job started");
    await updateJobStatus(jobId, JobStatus.ANALYZING, { startedAt: new Date() });
    await sleep(ANALYZE_DELAY_MS);
    await updateJobStatus(jobId, JobStatus.VERIFIED, { completedAt: new Date() });
    log.info("job verified (phase 1 stub)");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    log.error({ err: error }, "job failed");
    await markJobFailed(jobId, message);
    throw error;
  }
}
