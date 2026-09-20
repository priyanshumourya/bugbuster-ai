import type { JobDto, JobRecord, JobStatus } from "@bugbuster/types";
import { getPool } from "./pool.js";

type JobRow = {
  id: string;
  project_id: string | null;
  status: JobStatus;
  repo_url: string;
  branch: string | null;
  pr_number: number | null;
  started_at: Date | null;
  completed_at: Date | null;
  error: string | null;
  created_at: Date;
  updated_at: Date;
};

function toRecord(row: JobRow): JobRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    repoUrl: row.repo_url,
    branch: row.branch,
    prNumber: row.pr_number,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toJobDto(job: JobRecord): JobDto {
  return {
    id: job.id,
    projectId: job.projectId,
    status: job.status,
    repoUrl: job.repoUrl,
    branch: job.branch,
    prNumber: job.prNumber,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function insertJob(input: {
  id: string;
  status: JobStatus;
  repoUrl: string;
  branch?: string;
  prNumber?: number;
}): Promise<JobRecord> {
  const result = await getPool().query<JobRow>(
    `INSERT INTO jobs (id, status, repo_url, branch, pr_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.id, input.status, input.repoUrl, input.branch ?? null, input.prNumber ?? null],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to insert job");
  }
  return toRecord(row);
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const result = await getPool().query<JobRow>(`SELECT * FROM jobs WHERE id = $1`, [id]);
  const row = result.rows[0];
  return row ? toRecord(row) : null;
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  extras: {
    error?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  } = {},
): Promise<JobRecord | null> {
  const result = await getPool().query<JobRow>(
    `UPDATE jobs
     SET status = $2,
         error = COALESCE($3, error),
         started_at = COALESCE($4, started_at),
         completed_at = COALESCE($5, completed_at),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      status,
      extras.error === undefined ? null : extras.error,
      extras.startedAt === undefined ? null : extras.startedAt,
      extras.completedAt === undefined ? null : extras.completedAt,
    ],
  );
  const row = result.rows[0];
  return row ? toRecord(row) : null;
}

export async function markJobFailed(id: string, error: string): Promise<JobRecord | null> {
  const result = await getPool().query<JobRow>(
    `UPDATE jobs
     SET status = 'FAILED',
         error = $2,
         completed_at = now(),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, error],
  );
  const row = result.rows[0];
  return row ? toRecord(row) : null;
}
