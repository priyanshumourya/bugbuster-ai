import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { JobStatus } from "@bugbuster/types";
import { getJobById, insertJob, markJobFailed, toJobDto } from "@bugbuster/db";
import { enqueueJob } from "../jobs/queue.js";

const createJobBody = z.object({
  repoUrl: z.string().url(),
  branch: z.string().min(1).optional(),
  prNumber: z.number().int().positive().optional(),
});

export async function jobRoutes(app: FastifyInstance): Promise<void> {
  app.post("/jobs", async (request, reply) => {
    const parsed = createJobBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const jobId = crypto.randomUUID();
    const job = await insertJob({
      id: jobId,
      status: JobStatus.QUEUED,
      repoUrl: parsed.data.repoUrl,
      branch: parsed.data.branch,
      prNumber: parsed.data.prNumber,
    });

    try {
      await enqueueJob(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enqueue job";
      await markJobFailed(job.id, message);
      throw error;
    }

    return reply.code(201).send({
      jobId: job.id,
      status: job.status,
    });
  });

  app.get("/jobs/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await getJobById(jobId);
    if (!job) {
      return reply.code(404).send({ error: "Job not found" });
    }
    return toJobDto(job);
  });
}
