export const JobStatus = {
  QUEUED: "QUEUED",
  CLONING: "CLONING",
  ANALYZING: "ANALYZING",
  BUG_FOUND: "BUG_FOUND",
  TEST_GENERATING: "TEST_GENERATING",
  TESTING_BEFORE: "TESTING_BEFORE",
  BUG_REPRODUCED: "BUG_REPRODUCED",
  PATCH_GENERATING: "PATCH_GENERATING",
  PATCH_APPLYING: "PATCH_APPLYING",
  TESTING_AFTER: "TESTING_AFTER",
  REGRESSION_TESTING: "REGRESSION_TESTING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const QUEUE_NAME = "bugbuster";

export interface CreateJobRequest {
  repoUrl: string;
  branch?: string;
  prNumber?: number;
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobRecord {
  id: string;
  projectId: string | null;
  status: JobStatus;
  repoUrl: string;
  branch: string | null;
  prNumber: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobDto {
  id: string;
  projectId: string | null;
  status: JobStatus;
  repoUrl: string;
  branch: string | null;
  prNumber: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueJobPayload {
  jobId: string;
}

export interface Finding {
  id: string;
  jobId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  createdAt: Date;
}

export interface Patch {
  id: string;
  jobId: string;
  findingId: string | null;
  diff: string;
  applied: boolean;
  createdAt: Date;
}

export interface TestRun {
  id: string;
  jobId: string;
  phase: "before" | "after" | "regression";
  command: string;
  exitCode: number | null;
  stdout: string | null;
  stderr: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface VerificationResult {
  id: string;
  jobId: string;
  reproduced: boolean;
  patchSucceeded: boolean;
  regressionPassed: boolean | null;
  summary: string | null;
  createdAt: Date;
}

export interface Execution {
  id: string;
  jobId: string;
  step: JobStatus;
  detail: string | null;
  startedAt: Date;
  completedAt: Date | null;
}
