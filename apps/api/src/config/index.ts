import { createLogger, getEnv } from "@bugbuster/config";

export const env = getEnv();
export const logger = createLogger("api");
