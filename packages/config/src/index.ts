import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import pino from "pino";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | undefined;

function loadEnvFile(): void {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) {
      loadDotenv({ path: candidate });
      return;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  loadDotenv();
}

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }
  loadEnvFile();
  cachedEnv = EnvSchema.parse(process.env);
  return cachedEnv;
}

export function createLogger(name: string) {
  const env = getEnv();
  return pino({
    name,
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === "development"
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard" },
          },
        }
      : {}),
  });
}

export type RedisConnectionOptions = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  maxRetriesPerRequest: null;
};

export function getRedisConnectionOptions(): RedisConnectionOptions {
  const parsed = new URL(getEnv().REDIS_URL);
  const dbPath = parsed.pathname.replace(/^\//, "");
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: dbPath ? Number(dbPath) : undefined,
    maxRetriesPerRequest: null,
  };
}
