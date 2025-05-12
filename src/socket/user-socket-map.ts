import { redisClient } from "../lib/redis";

const SOCKET_PREFIX = "ws:user:";
const socketKey = (userId: string) => `${SOCKET_PREFIX}${userId}`;

/**
 * Redis에 유저-소켓 매핑 추가
 */
export async function addSocket(
  userId: string,
  socketId: string
): Promise<void> {
  try {
    await redisClient.sAdd(socketKey(userId), socketId);
    console.log(`[Redis] Added socket ${socketId} for user ${userId}`);
  } catch (err) {
    console.error(
      `[Redis] Failed to add socket ${socketId} for user ${userId}:`,
      err
    );
  }
}

/**
 * Redis에서 유저-소켓 매핑 제거 (남은 소켓 없으면 키 삭제)
 */
export async function removeSocket(
  userId: string,
  socketId: string
): Promise<void> {
  try {
    await redisClient.sRem(socketKey(userId), socketId);
    const remaining = await redisClient.sCard(socketKey(userId));

    if (remaining === 0) {
      await redisClient.del(socketKey(userId));
      console.log(
        `[Redis] All sockets removed. Key deleted for user ${userId}`
      );
    } else {
      console.log(
        `[Redis] Removed socket ${socketId} for user ${userId} (remaining: ${remaining})`
      );
    }
  } catch (err) {
    console.error(
      `[Redis] Failed to remove socket ${socketId} for user ${userId}:`,
      err
    );
  }
}

/**
 * 유저에 연결된 모든 소켓 ID 조회
 */
export async function getSockets(userId: string): Promise<string[]> {
  try {
    return await redisClient.sMembers(socketKey(userId));
  } catch (err) {
    console.error(`[Redis] Failed to get sockets for user ${userId}:`, err);
    return [];
  }
}
