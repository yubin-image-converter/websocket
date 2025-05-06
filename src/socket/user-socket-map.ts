import { redisClient } from "../lib/redis";

const socketKey = (userId: string) => `ws:user:${userId}`;

export async function addSocket(
  userId: string,
  socketId: string
): Promise<void> {
  await redisClient.sAdd(socketKey(userId), socketId);
  console.log(`[Redis] Added socket ${socketId} for user ${userId}`);
}

export async function removeSocket(
  userId: string,
  socketId: string
): Promise<void> {
  await redisClient.sRem(socketKey(userId), socketId);
  const remaining = await redisClient.sCard(socketKey(userId));

  if (remaining === 0) {
    await redisClient.del(socketKey(userId));
    console.log(`[Redis] All sockets removed. Key deleted for user ${userId}`);
  } else {
    console.log(
      `[Redis] Removed socket ${socketId} for user ${userId} (remaining: ${remaining})`
    );
  }
}

export async function getSockets(userId: string): Promise<string[]> {
  return await redisClient.sMembers(socketKey(userId));
}
