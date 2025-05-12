import { createClient } from "redis";
import { config } from "../config";

export const redisClient = createClient({
  url: config.redisUrl,
  database: config.redisDb,
});

export async function connectRedis() {
  try {
    await redisClient.connect();
    console.log("[Redis] Connected successfully to", config.redisUrl);
  } catch (err) {
    console.error("[Redis] Connection failed:", err);
    process.exit(1); // 치명적일 경우 즉시 종료
  }
}
