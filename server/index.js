import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  errorFormat: "pretty",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("사용자가 연결되었습니다", socket.id);

  socket.on("JOIN_ROOM", (room) => {
    if (!room) {
      console.error("room이 존재하지 않습니다.");
      return;
    }
    socket.join(room);
    console.log(`새로운 사용자가 ${room} 방에 입장했습니다.`);

    // 새로운 사용자가 입장했다는 메시지를 모든 사용자에게 공지
    io.to(room).emit("SEND_MESSAGE", {
      id: socket.id,
      content: `새로운 사용자가 ${room} 방에 입장하였습니다.`,
      sender: socket.id,
      timestamp: new Date().toLocaleString(),
    });
  });

  socket.on("SEND_MESSAGE", ({ room, message }) => {
    if (!room || !message) {
      console.error("room 또는 message 가 존재하지 않습니다.");
      return;
    }

    io.to(room).emit("SEND_MESSAGE", {
      id: socket.id + Math.random(),
      content: message,
      sender: socket.id,
      timestamp: new Date().toLocaleString(),
    });
    console.log(socket.id, "님의 SEND_MESSAGE", room, message);
  });

  socket.on("LEAVE_ROOM", (room) => {
    if (room) {
      // 본인한테도 자기가방을 나갔다는 메시지 띄우기
      socket.emit("SEND_MESSAGE", {
        id: socket.id,
        content: `당신은 ${room} 방을 나갔습니다.`,
        sender: socket.id,
        timestamp: new Date().toLocaleString(),
      });
      socket.leave(room);
      console.log(`${socket.id}님이 ${room} 방을 떠났습니다.`);

      // 사용자가 방을 나갔다면 메시지를 모든 사용자에게 공지
      io.to(room).emit("SEND_MESSAGE", {
        id: socket.id,
        content: `사용자 ${socket.id}님이 ${room} 방을 떠났습니다.`,
        sender: socket.id,
        timestamp: new Date().toLocaleString(),
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("사용자가 연결을 끊었습니다", socket.id);
  });
});

app.use(express.static(path.join(path.resolve(), "public")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(path.resolve(), "public", "index.html"));
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
