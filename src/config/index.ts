import "dotenv/config";

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`❌ 환경변수 ${key}가 설정되지 않았습니다.`);
  }
  return value ?? fallback!;
}

const env = getEnv("NODE_ENV", "development");
const isProd = env === "production";

const clientSocketPort = Number(getEnv("CLIENT_SOCKET_PORT", "4000"));
const workerSocketPort = Number(getEnv("WORKER_SOCKET_PORT", "4001"));

export const config = {
  env,
  isProd,
  logLevel: getEnv("LOG_LEVEL", "info"),

  clientOrigin: getEnv("CLIENT_ORIGIN", "http://localhost:5173"),
  apiServerUrl: getEnv("API_SERVER_URL"),

  clientSocketPort,
  workerSocketPort,

  redisUrl: getEnv("REDIS_URL", "redis://localhost:6379"),
  redisDb: Number(getEnv("REDIS_DB", "0")),

  clientSocketUrl: isProd
    ? getEnv("CLIENT_SOCKET_URL") // 배포 시 반드시 필요
    : `ws://localhost:${clientSocketPort}`,

  workerSocketUrl: isProd
    ? getEnv("WORKER_SOCKET_URL")
    : `ws://localhost:${workerSocketPort}`,
};
