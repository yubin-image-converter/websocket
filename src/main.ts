// src/main.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // 배포 시엔 도메인 지정
  },
});

// WebSocket 연결
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// 간단한 HTTP API
app.use(express.json());

app.post("/progress", (req, res) => {
  const { taskId, userId, progress } = req.body;
  console.log(`Progress update from Rust:`, req.body);

  // 나중에 Redis로 userId → socketId 매핑 후 사용
  io.emit("progress", { taskId, progress });

  res.sendStatus(200);
});

httpServer.listen(4000, () => {
  console.log("WebSocket + HTTP Server running on http://localhost:4000");
});
