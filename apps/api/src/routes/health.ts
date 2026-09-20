import type { FastifyInstance } from "fastify";
import { checkDatabase } from "@bugbuster/db";
import { checkRedis } from "../redis/client.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
  }));

  app.get("/ready", async (_request, reply) => {
    const checks: Record<string, "ok" | "error"> = {
      postgres: "ok",
      redis: "ok",
    };

    try {
      await checkDatabase();
    } catch {
      checks.postgres = "error";
    }

    try {
      await checkRedis();
    } catch {
      checks.redis = "error";
    }

    const ready = checks.postgres === "ok" && checks.redis === "ok";
    return reply.code(ready ? 200 : 503).send({
      status: ready ? "ready" : "not_ready",
      checks,
    });
  });
}
