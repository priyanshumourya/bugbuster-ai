import { env, logger } from "./config/index.js";
import { buildApp, closeAppResources } from "./app.js";

const app = await buildApp();

const shutdown = async (signal: string) => {
  logger.info({ signal }, "shutting down api");
  try {
    await app.close();
    await closeAppResources();
  } catch (error) {
    logger.error({ err: error }, "error during api shutdown");
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
  logger.info({ host: env.API_HOST, port: env.API_PORT }, "api listening");
} catch (error) {
  logger.error({ err: error }, "failed to start api");
  process.exit(1);
}
