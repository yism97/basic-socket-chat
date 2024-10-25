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
  // 새로운 사용자가 입장했다는 메시지를 모든 사용자에게 공지
  socket.broadcast.emit("SEND_MESSAGE", {
    id: socket.id,
    content: "새로운 사용자가 채팅방에 입장하였습니다.",
    sender: socket.id,
    timestamp: new Date().toLocaleString(),
  });
  console.log("사용자가 연결되었습니다", socket.id);

  socket.on("SEND_MESSAGE", async (msg) => {
    const message = {
      senderId: socket.id,
      content: msg,
      timestamp: new Date().toISOString(),
    };

    const Message = await prisma.message.create({
      data: message,
    });

    console.log(message);

    io.emit("SEND_MESSAGE", {
      id: socket.id,
      content: Message.content,
      sender: Message.senderId,
      timestamp: new Date().toLocaleString(),
    });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("SEND_MESSAGE", {
      // id: socket.id,
      // content: "사용자가 채팅방을 나갔습니다",
      // sender: socket.id,
      // timestamp: new Date().toLocaleString(),
    });
    console.log("사용자가 연결을 끊었습니다", socket.id);
  });
});
app.get("/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        timestamp: "asc", // 시간순으로 오름차순하기(굳이 안해도 되긴할듯?)
      },
    });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("메시지를 조회 중 오류가 발생하였습니다.", error);
    res.status(500).json({ error: "메시지를 조회 중 오류가 발생했습니다." });
  }
});

app.use(express.static(path.join(path.resolve(), "public")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(path.resolve(), "public", "index.html"));
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
