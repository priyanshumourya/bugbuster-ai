CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects (id),
  status TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  branch TEXT,
  pr_number INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs (created_at DESC);

CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL,
  file_path TEXT,
  line_start INTEGER,
  line_end INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS findings_job_id_idx ON findings (job_id);

CREATE TABLE IF NOT EXISTS patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings (id) ON DELETE SET NULL,
  diff TEXT NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patches_job_id_idx ON patches (job_id);

CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  command TEXT NOT NULL,
  exit_code INTEGER,
  stdout TEXT,
  stderr TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_runs_job_id_idx ON test_runs (job_id);

CREATE TABLE IF NOT EXISTS verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  reproduced BOOLEAN NOT NULL,
  patch_succeeded BOOLEAN NOT NULL,
  regression_passed BOOLEAN,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_results_job_id_idx ON verification_results (job_id);
