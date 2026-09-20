const base = process.env.API_URL ?? "http://127.0.0.1:3000";

async function getJson(path) {
  const response = await fetch(`${base}${path}`);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

const health = await getJson("/health");
if (health.status !== 200 || health.body.status !== "ok") {
  console.error("health check failed", health);
  process.exit(1);
}

const ready = await getJson("/ready");
if (ready.status !== 200 || ready.body.status !== "ready") {
  console.error("ready check failed", ready);
  process.exit(1);
}

const created = await fetch(`${base}/api/v1/jobs`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ repoUrl: "https://github.com/nodejs/node" }),
});
const createdBody = await created.json();
if (created.status !== 201 || !createdBody.jobId) {
  console.error("create job failed", created.status, createdBody);
  process.exit(1);
}

const { jobId } = createdBody;
console.log("created job", createdBody);

for (let i = 0; i < 30; i += 1) {
  const job = await getJson(`/api/v1/jobs/${jobId}`);
  console.log("poll", job.body.status);
  if (job.body.status === "VERIFIED") {
    console.log("phase 1 pipeline ok", job.body);
    process.exit(0);
  }
  if (job.body.status === "FAILED") {
    console.error("job failed", job.body);
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.error("timed out waiting for VERIFIED");
process.exit(1);
