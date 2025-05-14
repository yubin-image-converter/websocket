import { redisClient } from "../lib/redis";

const SOCKET_PREFIX = "ws:user:";
const socketKey = (userId: string) => `${SOCKET_PREFIX}${userId}`;

/**
 * Redis에 유저-클라이언트 소켓 매핑 추가
 */
export async function addSocket(
  userId: string,
  clientId: string,
  socket: any
): Promise<void> {
  try {
    await redisClient.hSet(socketKey(userId), clientId, socket.id);
    console.log(
      `[Redis] Added socket ${socket.id} for user ${userId}, client ${clientId}`
    );
  } catch (err) {
    console.error(
      `[Redis] Failed to add socket ${socket.id} for user ${userId}, client ${clientId}:`,
      err
    );
  }
}

/**
 * Redis에서 유저-클라이언트 소켓 매핑 제거 (남은 소켓 없으면 키 삭제)
 */
export async function removeSocket(
  userId: string,
  clientId: string
): Promise<void> {
  try {
    await redisClient.hDel(socketKey(userId), clientId);
    const remaining = await redisClient.hLen(socketKey(userId));

    if (remaining === 0) {
      await redisClient.del(socketKey(userId));
      console.log(
        `[Redis] All client sockets removed. Key deleted for user ${userId}`
      );
    } else {
      console.log(`[Redis] Removed client ${clientId} for user ${userId}`);
    }
  } catch (err) {
    console.error(
      `[Redis] Failed to remove client ${clientId} for user ${userId}:`,
      err
    );
  }
}

/**
 * Redis에서 해당 유저의 모든 소켓 ID 가져오기
 */
export async function getAllSocketIds(userId: string): Promise<string[]> {
  try {
    const socketMap = await redisClient.hGetAll(socketKey(userId));
    return Object.values(socketMap) as string[];
  } catch (err) {
    console.error(`[Redis] Failed to get all sockets for user ${userId}:`, err);
    return [];
  }
}
