import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";

import { connectRedis, redisClient } from "./lib/redis";
import { addSocket, removeSocket } from "./socket/user-socket-map";

async function bootstrap() {
  await connectRedis();
  console.log("✅ Redis 연결 성공");

  // -------------------------
  // 1. 클라이언트용 소켓 (React) - PORT 4000
  // -------------------------
  const app1 = express();
  const server1 = http.createServer(app1);

  const clientIO = new Server(server1, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true,
    },
    path: "/socket.io",
  });

  clientIO.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      console.warn("⚠️ [Client Socket] userId 없음 → 연결 종료");
      socket.disconnect();
      return;
    }

    console.log(`🟢 [Client 연결됨] userId=${userId}, socketId=${socket.id}`);
    socket.join(userId);

    void addSocket(userId, socket.id);

    socket.on("disconnect", () => {
      void removeSocket(userId, socket.id);
      console.log(
        `🔌 [Client 연결 종료] userId=${userId}, socketId=${socket.id}`
      );
    });
  });

  server1.listen(4000, () => {
    console.log("🚀 [Client Socket] http://localhost:4000");
  });

  // -------------------------
  // 2. ASCII 워커용 소켓 - PORT 4001
  // -------------------------
  const app2 = express();
  const server2 = http.createServer(app2);

  const asciiWSS = new WebSocketServer({ server: server2, path: "/" });

  asciiWSS.on("connection", (ws) => {
    console.log("⚙️ [Rust 워커 연결됨] WebSocket 연결 수립됨");

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const { event, data: payload } = msg;

        console.log("📩 [워커 메시지 수신]", msg);

        switch (event) {
          case "ascii_complete": {
            const { userId, requestId, txtUrl } = payload;
            console.log(
              `✅ [ASCII 완료] userId=${userId}, requestId=${requestId}`
            );

            // 프론트 전달
            clientIO.to(userId).emit("ascii_complete", payload);
            console.log(`➡️ [클라이언트 전달 완료] ascii_complete`);

            // Spring Boot 서버에 POST
            const apiUrl = process.env.API_SERVER_URL + "/ascii/done";
            await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            console.log(`📬 [Spring API 요청 완료] → ${apiUrl}`);
            break;
          }

          case "progress_update": {
            const { userId, requestId, progress } = payload;
            console.log(`📈 [Progress] ${progress}% (userId=${userId})`);

            clientIO.to(userId).emit("progress_update", payload);
            break;
          }

          default:
            console.warn("⚠️ 알 수 없는 event:", event);
        }
      } catch (err) {
        console.error("❌ 메시지 파싱 실패:", err);
      }
    });

    ws.on("close", () => {
      console.log("🔒 [Rust 워커 연결 종료]");
    });
  });

  server2.listen(4001, () => {
    console.log("🚀 [Worker Socket] ws://localhost:4001");
  });
}

bootstrap();
