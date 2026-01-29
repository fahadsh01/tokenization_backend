import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dbConnect from "./db/db.js";

dotenv.config({ path: "./env" });

let io;

dbConnect()
  .then(() => {
    const server = http.createServer(app);

    // ✅ Socket initialized HERE
    io = new Server(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN,
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("join-hospital", (tenantId) => {
        socket.join(`hospital:${tenantId}`);
        console.log(`🏥 Joined hospital:${tenantId}`);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
  });

export { io };
