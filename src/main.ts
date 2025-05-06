import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectRedis, redisClient } from "./lib/redis";
import { addSocket, removeSocket } from "./socket/user-socket-map";

async function bootstrap() {
  await connectRedis();

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      console.warn(`[Socket] Missing userId. Disconnecting: ${socket.id}`);
      socket.disconnect();
      return;
    }

    console.log({ userId, socketId: socket.id });
    void addSocket(userId, socket.id);

    socket.on("disconnect", () => {
      void removeSocket(userId, socket.id);
    });
  });
  server.listen(4000, () => {
    console.log("WebSocket server running on http://localhost:4000");
  });
}

bootstrap();

// // src/main.ts
// import express from "express";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import { redisClient } from "./lib/redis";

// const app = express();
// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*", // 배포 시엔 도메인 지정
//     methods: ["GET", "POST"],
//   },
// });

// // WebSocket 연결
// // io.on("connection", (socket) => {
// //   console.log(`Client connected: ${socket.id}`);

// //   socket.on("disconnect", () => {
// //     console.log(`Client disconnected: ${socket.id}`);
// //   });
// // });
// // io.on("connection", (socket) => {
// //   console.log(`client connected: ${socket.id}`);

// //   socket.on("disconnect", () => {
// //     console.log(`client disconnected: ${socket.id}`);
// //   });

// //   socket.on("ping", (msg) => {
// //     console.log("ping:", msg);
// //     socket.emit("pong", "hi from server!");
// //   });
// // });

// io.on("connection", async (socket) => {
//   const userId = "mock-user-id"; // 다음 단계에서 JWT로 교체 예정

//   console.log(`client connected: ${socket.id}`);

//   // Redis에 저장
//   await redisClient.set(`ws:uid:${userId}`, socket.id);
//   await redisClient.set(`ws:sid:${socket.id}`, userId);

//   socket.on("disconnect", async () => {
//     console.log(`client disconnected: ${socket.id}`);

//     const uid = await redisClient.get(`ws:sid:${socket.id}`);
//     if (uid) {
//       await redisClient.del(`ws:uid:${uid}`);
//     }

//     await redisClient.del(`ws:sid:${socket.id}`);
//   });
// });
// // 간단한 HTTP API
// app.use(express.json());

// // app.post("/progress", (req, res) => {
// //   const { taskId, userId, progress } = req.body;
// //   console.log(`Progress update from Rust:`, req.body);

// //   // 나중에 Redis로 userId → socketId 매핑 후 사용
// //   io.emit("progress", { taskId, progress });

// //   res.sendStatus(200);
// // });

// httpServer.listen(4000, () => {
//   console.log("WebSocket + HTTP Server running on http://localhost:4000");
// });
