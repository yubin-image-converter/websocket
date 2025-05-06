import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  database: Number(process.env.REDIS_DB) || 0,
});

export async function connectRedis() {
  try {
    await redisClient.connect();
    console.log("[Redis] Connected successfully to", process.env.REDIS_URL);
  } catch (err) {
    console.error("[Redis] Connection failed:", err);
    process.exit(1); // 연결 실패 시 종료해도 좋음
  }
}
