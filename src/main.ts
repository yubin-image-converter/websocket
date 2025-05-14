import { config } from "./config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
import { connectRedis } from "./lib/redis";
import { addSocket, removeSocket } from "./socket/redis-user-socket-map";
import {
  addLocalSocket,
  removeLocalSocket,
} from "./socket/local-user-socket-map";

async function bootstrap() {
  await connectRedis();
  console.log("[Redis] Connected successfully");

  // -------------------------
  // 1. Client Socket (React)
  // -------------------------
  const app1 = express();
  const server1 = http.createServer(app1);

  const clientIO = new Server(server1, {
    cors: {
      origin: [config.clientOrigin],
      credentials: true,
    },
    path: "/socket.io",
  });

  clientIO.on("connection", (socket) => {
    const { userId, clientId } = socket.handshake.auth;
    if (!userId || !clientId) {
      console.warn(
        "[Client Socket] Missing userId or clientId → disconnecting..."
      );
      socket.disconnect();
      return;
    }

    console.log(
      `🔌 [Client Socket] Connected: userId=${userId}, clientId=${clientId}, socketId=${socket.id}`
    );
    addSocket(userId, clientId, socket);
    addLocalSocket(userId, clientId, socket);
    socket.on("disconnect", () => {
      console.log(
        `🛑 [Client Socket] Disconnected: userId=${userId}, clientId=${clientId}, socketId=${socket.id}`
      );
      removeSocket(userId, clientId);
      removeLocalSocket(userId, clientId);
    });
  });

  server1.listen(config.clientSocketPort, () => {
    console.log(`[Client Socket] Ready at: ${config.clientSocketUrl}`);
  });

  // -------------------------
  // 2. Worker Socket (Rust WebSocket)
  // -------------------------
  const app2 = express();
  const server2 = http.createServer(app2);

  const asciiWSS = new WebSocketServer({ server: server2, path: "/" });

  asciiWSS.on("connection", (ws) => {
    console.log("[Worker Socket] Worker connected via WebSocket");

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const { event, data: payload } = msg;

        console.log("[Worker Socket] Message received:", msg);

        switch (event) {
          case "ascii_complete": {
            const { userId, requestId } = payload;
            console.log(
              `[Worker Socket] ASCII conversion complete: userId=${userId}, requestId=${requestId}`
            );

            clientIO.to(userId).emit("ascii_complete", payload);
            console.log("[Worker Socket → Client] Emitted: ascii_complete");

            const apiUrl = `${config.apiServerUrl}/api/converts/complete`;
            await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            console.log(`[Worker Socket → API] POST successful: ${apiUrl}`);
            break;
          }

          case "progress_update": {
            const { userId, requestId, progress } = payload;
            console.log(
              `[Worker Socket] Progress update: ${progress}% (userId=${userId})`
            );

            clientIO.to(userId).emit("progress_update", payload);
            console.log(`[Worker Socket → Client] Emitted: progress_update`);
            break;
          }

          default:
            console.warn(`[Worker Socket] Unknown event received: ${event}`);
        }
      } catch (err) {
        console.error("[Worker Socket] Failed to parse message:", err);
      }
    });

    ws.on("close", () => {
      console.log("[Worker Socket] Connection closed");
    });
  });

  server2.listen(config.workerSocketPort, () => {
    console.log(`[Worker Socket] Ready at: ${config.workerSocketUrl}`);
  });
}

bootstrap();
