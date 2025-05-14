const globalUserSocketMap: Record<string, Record<string, any>> = {};

export function addLocalSocket(userId: string, clientId: string, socket: any) {
  if (!globalUserSocketMap[userId]) globalUserSocketMap[userId] = {};
  globalUserSocketMap[userId][clientId] = socket;
}

export function removeLocalSocket(userId: string, clientId: string) {
  if (globalUserSocketMap[userId]) {
    delete globalUserSocketMap[userId][clientId];
    if (Object.keys(globalUserSocketMap[userId]).length === 0) {
      delete globalUserSocketMap[userId];
    }
  }
}
