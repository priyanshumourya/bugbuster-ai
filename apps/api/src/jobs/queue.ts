import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "@bugbuster/config";
import { QUEUE_NAME, type QueueJobPayload } from "@bugbuster/types";

let queue: Queue<QueueJobPayload> | undefined;

export function getJobQueue(): Queue<QueueJobPayload> {
  if (!queue) {
    queue = new Queue<QueueJobPayload>(QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
    });
  }
  return queue;
}

export async function enqueueJob(jobId: string): Promise<void> {
  await getJobQueue().add(
    "process-job",
    { jobId },
    {
      jobId,
      attempts: 1,
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  );
}

export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}
