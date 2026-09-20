import { Redis } from "ioredis";
import { getEnv } from "@bugbuster/config";

let redis: Redis | undefined;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return redis;
}

export async function checkRedis(): Promise<void> {
  const pong = await getRedis().ping();
  if (pong !== "PONG") {
    throw new Error(`Unexpected Redis ping response: ${pong}`);
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = undefined;
  }
}
